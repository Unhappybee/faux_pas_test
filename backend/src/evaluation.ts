import {PrismaClient, Question, QuestionType, Story, StoryType, UserAnswer} from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Interface for the expected response structure from the ML API
interface MlEvaluationResponse {
  score: number;        // 0 for incorrect, 1 for correct
  probability: number;  // Confidence score from the ML model
}

// URL for the Python ML API, configurable via environment variable or defaults
// to localhost
const PYTHON_API_URL =
    process.env.ML_API_URL || 'http://localhost:8000/evaluate';

// Type alias for a Question object that also includes its related Story data
type QuestionWithStory = Question&{
  story: Story|null;
};

/**
 * Helper function to determine if a user's answer is correct based on the
 * question type. For MULTIPLE_CHOICE, it handles answers that might contain
 * multiple selected options separated by semicolons and compares them against a
 * comma-separated list of correct answers. For other types, it performs a
 * case-insensitive string comparison.
 *
 * @param userAnswerText The text of the user's answer.
 * @param correctAnswerString The string containing the correct answer(s).
 * @param questionType The type of the question (BOOLEAN, MULTIPLE_CHOICE,
 *     OPEN_ENDED).
 * @returns True if the answer is correct, false otherwise.
 */
function isAnswerCorrect(
    userAnswerText: string, correctAnswerString: string|null,
    questionType: QuestionType): boolean {
  if (!correctAnswerString)
    return false;  // No correct answer defined, so user's answer cannot be
                   // correct

  if (questionType === QuestionType.MULTIPLE_CHOICE) {
    // Normalize and split correct answers (stored as comma-separated string,
    // potentially with brackets/quotes)
    const correctAnswers =
        correctAnswerString
            .replace(/[\[\]"]+/g, '')  // Remove brackets and quotes
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .filter((s) => s.length > 0);  // Remove empty strings

    // Normalize and split user's answers (can be multiple, separated by ';')
    const userAnswers =
        userAnswerText.split(';')
            .map((s) => s.trim().toLowerCase())
            .filter((s) => s.length > 0);  // Remove empty strings

    // All user-provided answers must be present in the list of correct answers
    return userAnswers.every((ans) => correctAnswers.includes(ans));
  }

  // For BOOLEAN or OPEN_ENDED (when rule-based), perform a simple
  // case-insensitive comparison
  return userAnswerText.trim().toLowerCase() ===
      correctAnswerString.trim().toLowerCase();
}


/**
 * Evaluates all answers submitted by a specific user for the Faux Pas test.
 * This function:
 * 1. Fetches all user answers and associated question/story details.
 * 2. Groups answers by story.
 * 3. For each story:
 *    a. Validates control questions (Q7, Q8). If any are failed, the story is
 * marked invalid (-1 score for all its questions). b. If valid, scores Q1
 * (detection) based on its type (rule-based or ML). c. Scores child questions
 * (Q2-Q4) conditionally based on Q1's correctness and story type (CONTROL
 * stories have special logic for "No" on Q1). d. Scores independent questions
 * (Q5, Q6). e. Scores control questions (Q7, Q8) with 0 or 1 if the story is
 * valid.
 * 4. Updates the `evaluation` field in the `UserAnswer` table in the database
 * with the calculated scores.
 *
 * @param userId The ID of the user whose test answers are to be evaluated.
 * @returns A promise that resolves to an array of objects, each containing a
 *     questionId and its calculated score.
 */
export async function evaluateUserTest(userId: number) {
  // Get all answers for the user, including question and story details
  const userAnswersWithDetails = await prisma.userAnswer.findMany({
    where: {userId},
    include: {
      question: {
        include: {
          story: true,
        },
      },
    },
  });

  if (!userAnswersWithDetails.length) {
    console.log(`No answers found for user ${userId} to evaluate.`);
    return [];
  }

  // Group answers and questions by story
  const storyIdsAnswered =
      [...new Set(userAnswersWithDetails.map(ua => ua.question.storyId)
                      .filter(id => id !== null))] as number[];

  // Fetch all questions related to these stories, including their story data
  const allQuestionsForStories = await prisma.question.findMany(
      {where: {storyId: {in : storyIdsAnswered}}, include: {story: true}});

  // Organize questions by their story ID for efficient lookup
  const questionsByStoryId = new Map<number, QuestionWithStory[]>();
  allQuestionsForStories.forEach(q => {
    if (q.storyId) {
      if (!questionsByStoryId.has(q.storyId)) {
        questionsByStoryId.set(q.storyId, []);
      }
      questionsByStoryId.get(q.storyId)!.push(
          q as QuestionWithStory);  // Cast as QuestionWithStory
    }
  });

  // Map user answers by question ID for quick access
  const userAnswersMap = new Map<number, UserAnswer>(
      userAnswersWithDetails.map(ua => [ua.questionId, ua]));
  // Array to store the evaluation results before database update
  const evaluatedResults: {questionId: number; score: number | null}[] = [];

  //  Process each story
  for (const storyId of storyIdsAnswered) {
    const questionsInStory = questionsByStoryId.get(storyId) || [];
    if (!questionsInStory.length) continue;

    const storyData = questionsInStory[0].story;
    if (!storyData) {
      console.warn(`Story data missing for storyId ${storyId}. Skipping.`);
      continue;
    }

    // Check Control Questions for this story FIRST (Q7, Q8)
    let storyIsValid = true;
    const controlQs = questionsInStory.filter(
        q => q.isControl && q.orderInStory && [7, 8].includes(q.orderInStory));

    for (const cq of controlQs) {
      const userAnswer = userAnswersMap.get(cq.id);
      // If a control question is not answered or answered incorrectly, the
      // story is invalid
      if (!userAnswer ||
          !isAnswerCorrect(
              userAnswer.answerText, cq.correctAnswer, cq.questionType)) {
        storyIsValid = false;
        console.log(`User ${userId} failed control Q (ID: ${cq.id}, Order: ${
            cq.orderInStory}) for story ${storyId}`);
        break;  // One failed control invalidates the story
      }
    }

    // If story is invalid, score all its questions -1 and move to the next

    if (!storyIsValid) {
      console.log(`Story ${
          storyId} is invalid due to failed control question. Scoring all its questions -1.`);
      questionsInStory.forEach(q => {
        evaluatedResults.push({questionId: q.id, score: -1});
      });
      continue;
    }

    // Story is valid, proceed with evaluating Q1 (Faux Pas detection)
    const q1 = questionsInStory.find(q => q.orderInStory === 1);
    let q1Score: number|null = null;

    if (q1) {
      const q1UserAnswer = userAnswersMap.get(q1.id);
      // Score Q1 based on its type (Boolean/MultipleChoice or OpenEnded via ML)
      if (q1.questionType === QuestionType.BOOLEAN ||
          q1.questionType === QuestionType.MULTIPLE_CHOICE) {
        if (q1UserAnswer) {
          q1Score =
              isAnswerCorrect(
                  q1UserAnswer.answerText, q1.correctAnswer, q1.questionType) ?
              1 :
              0;
        } else {
          q1Score = 0;  // Missing answer for Q1 is incorrect
        }
      } else if (q1.questionType === QuestionType.OPEN_ENDED) {
        if (!q1UserAnswer?.answerText) {
          q1Score = 0;
        } else if (!storyData.storyText) {
          q1Score = null;
          console.error('Missing story text for Q1 ML call');
        } else {  // Call ML API
          try {
            const response =
                await axios.post<MlEvaluationResponse>(PYTHON_API_URL, {
                  story: storyData.storyText,
                  question: q1.questionText,
                  answer: q1UserAnswer.answerText,
                });
            q1Score = response.data.score;
          } catch (e: any) {
            q1Score = null;
            console.error('ML API error for Q1:', e.message);
          }
        }
      }
      evaluatedResults.push({questionId: q1.id, score: q1Score});
    } else {
      console.warn(`Q1 not found for story ${storyId}`);
    }

    // Determine if Q1 was answered correctly and if the answer was "No"
    const q1AnsweredCorrectly = q1Score === 1;
    const q1AnswerWasNo = q1 &&
        userAnswersMap.get(q1.id)?.answerText.trim().toLowerCase() === 'no';

    // Evaluate child questions Q2, Q3, Q4 (dependent on Q1)
    for (const order of [2, 3, 4]) {
      const childQ = questionsInStory.find(q => q.orderInStory === order);
      if (!childQ) {
        console.warn(`Q${order} not found for story ${storyId}`);
        continue;
      }

      const childUserAnswer = userAnswersMap.get(childQ.id);
      let childScore: number|null = null;

      // Special scoring for Control stories where Q1 is correctly "No":
      // User gets points for *not* answering Q2, Q3, Q4.
      // If they do answer, they get 0 for that child question.
      if (storyData.storyType === StoryType.CONTROL && q1AnsweredCorrectly &&
          q1AnswerWasNo) {
        if (childUserAnswer) {
          childScore = 0;
          console.log(
              `Control Story ${storyId}, Q${order}: Answered (final score 0).`);
        } else {
          // Not answered (correct for this scenario).
          // `evaluateUserTest` doesn't score a non-answer here;
          // `calculateFinalScoresForUser` handles giving the point.
          console.log(`Control Story ${storyId}, Q${
              order}: Not answered (final score 1 will be derived later).`);
          evaluatedResults.push({questionId: childQ.id, score: null});
          continue;
        }
      }
      // Regular scoring for Faux Pas Story Q2,3,4 or Control Story Q2,3,4 if Q1
      // wasn't "correct No"
      else if (q1AnsweredCorrectly) {  // Parent Q1 was correct
        if (childQ.questionType === QuestionType.BOOLEAN ||
            childQ.questionType === QuestionType.MULTIPLE_CHOICE) {
          if (childUserAnswer) {
            childScore = isAnswerCorrect(
                             childUserAnswer.answerText, childQ.correctAnswer,
                             childQ.questionType) ?
                1 :
                0;
          } else {
            childScore = 0;
          }
        } else if (
            childQ.questionType === QuestionType.OPEN_ENDED) {  // Typically
                                                                // Q3, Q4
                                                                // for FP
          if (!childUserAnswer?.answerText) {
            childScore = 0;
          } else if (!storyData.storyText) {
            childScore = null;
            console.error('Missing story for ML call for child question');
          } else {  // Call ML API
            try {
              const response =
                  await axios.post<MlEvaluationResponse>(PYTHON_API_URL, {
                    story: storyData.storyText,
                    question: childQ.questionText,
                    answer: childUserAnswer.answerText,
                  });
              childScore = response.data.score;
            } catch (e: any) {
              childScore = null;
              console.error(`ML API error for Q${order}:`, e.message);
            }
          }
        }
      } else {           // Parent Q1 was incorrect
        childScore = 0;  // Q2,3,4 are 0 if Q1 is incorrect
      }
      evaluatedResults.push({questionId: childQ.id, score: childScore});
    }

    // Evaluate Q5, Q6 (independent of Q1's correctness, if story is valid)
    for (const order of [5, 6]) {
      const q_independent =
          questionsInStory.find(q => q.orderInStory === order);
      if (!q_independent) {
        console.warn(`Q${order} not found for story ${storyId}`);
        continue;
      }
      const userAnswer = userAnswersMap.get(q_independent.id);
      let score_independent: number|null = 0;  // Default to 0 if no answer

      if (userAnswer) {
        if (q_independent.questionType === QuestionType.BOOLEAN ||
            q_independent.questionType === QuestionType.MULTIPLE_CHOICE) {
          score_independent =
              isAnswerCorrect(
                  userAnswer.answerText, q_independent.correctAnswer,
                  q_independent.questionType) ?
              1 :
              0;
        } else {
          console.warn(`Q${order} for story ${storyId} is unexpectedly ${
              q_independent.questionType}`);
          score_independent = null;
        }
      }
      evaluatedResults.push(
          {questionId: q_independent.id, score: score_independent});
    }

    // Add scores for control questions (Q7, Q8) if the story was deemed
    // valid. Their correctness contributed to story_is_valid, now we record
    // their actual 0/1 scores.
    controlQs.forEach(cq => {
      const userAnswer = userAnswersMap.get(cq.id);
      if (userAnswer) {
        evaluatedResults.push({
          questionId: cq.id,
          score: isAnswerCorrect(  // Re-evaluate to get 0 or 1, not just for
                                   // validity check
                     userAnswer.answerText, cq.correctAnswer, cq.questionType) ?
              1 :
              0
        });
      }
    });
  }

  // Update evaluations in DB
  for (const result of evaluatedResults) {
    // Ensure we only update answers that exist for the user
    if (userAnswersMap.has(result.questionId)) {
      await prisma.userAnswer.update({
        where: {
          userId_questionId: {
            userId: userId,
            questionId: result.questionId,
          },
        },
        data: {
          evaluation: result.score,
        },
      });
    } else if (result.score !== null) {
      console.warn(`Attempted to update evaluation for Question ID ${
          result.questionId} (score: ${
          result.score}) but no UserAnswer record was found for user ${
          userId}.`);
    }
  }
  return evaluatedResults;
}