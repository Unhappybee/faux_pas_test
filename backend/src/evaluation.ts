import {PrismaClient, Question, QuestionType, Story, StoryType, UserAnswer} from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

interface MlEvaluationResponse {
  score: number;
  probability: number;
}
const PYTHON_API_URL =
    process.env.ML_API_URL || 'http://localhost:8000/evaluate';

type QuestionWithStory = Question&{
  story: Story|null;
};

// Helper to determine if an answer is correct
function isAnswerCorrect(
    userAnswerText: string, correctAnswerString: string|null,
    questionType: QuestionType): boolean {
  if (!correctAnswerString) return false;

  if (questionType === QuestionType.MULTIPLE_CHOICE) {
    const correctAnswers = correctAnswerString.replace(/[\[\]"]+/g, '')
                               .split(',')
                               .map((s) => s.trim().toLowerCase())
                               .filter((s) => s.length > 0);
    const userAnswers = userAnswerText.split(';')
                            .map((s) => s.trim().toLowerCase())
                            .filter((s) => s.length > 0);
    return userAnswers.every((ans) => correctAnswers.includes(ans));
  }
  return userAnswerText.trim().toLowerCase() ===
      correctAnswerString.trim().toLowerCase();
}


export async function evaluateUserTest(userId: number) {
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

  const storyIdsAnswered =
      [...new Set(userAnswersWithDetails.map(ua => ua.question.storyId)
                      .filter(id => id !== null))] as number[];

  const allQuestionsForStories = await prisma.question.findMany(
      {where: {storyId: {in : storyIdsAnswered}}, include: {story: true}});

  const questionsByStoryId = new Map<number, QuestionWithStory[]>();
  allQuestionsForStories.forEach(q => {
    if (q.storyId) {
      if (!questionsByStoryId.has(q.storyId)) {
        questionsByStoryId.set(q.storyId, []);
      }
      questionsByStoryId.get(q.storyId)!.push(q);
    }
  });

  const userAnswersMap = new Map<number, UserAnswer>(
      userAnswersWithDetails.map(ua => [ua.questionId, ua]));
  const evaluatedResults: {questionId: number; score: number | null}[] = [];

  for (const storyId of storyIdsAnswered) {
    const questionsInStory = questionsByStoryId.get(storyId) || [];
    if (!questionsInStory.length) continue;

    const storyData = questionsInStory[0].story;
    if (!storyData) {
      console.warn(`Story data missing for storyId ${storyId}. Skipping.`);
      continue;
    }

    let storyIsValid = true;
    const controlQs = questionsInStory.filter(
        q => q.isControl && q.orderInStory && [7, 8].includes(q.orderInStory));

    for (const cq of controlQs) {
      const userAnswer = userAnswersMap.get(cq.id);
      if (!userAnswer ||
          !isAnswerCorrect(
              userAnswer.answerText, cq.correctAnswer, cq.questionType)) {
        storyIsValid = false;
        console.log(`User ${userId} failed control Q (ID: ${cq.id}, Order: ${
            cq.orderInStory}) for story ${storyId}`);
        break;
      }
    }

    if (!storyIsValid) {
      console.log(`Story ${
          storyId} is invalid due to failed control question. Scoring all its questions -1.`);
      questionsInStory.forEach(q => {
        evaluatedResults.push({questionId: q.id, score: -1});
      });
      continue;
    }

    const q1 = questionsInStory.find(q => q.orderInStory === 1);
    let q1Score: number|null = null;

    if (q1) {
      const q1UserAnswer = userAnswersMap.get(q1.id);
      if (q1.questionType === QuestionType.BOOLEAN ||
          q1.questionType === QuestionType.MULTIPLE_CHOICE) {
        if (q1UserAnswer) {
          q1Score =
              isAnswerCorrect(
                  q1UserAnswer.answerText, q1.correctAnswer, q1.questionType) ?
              1 :
              0;
        } else {
          q1Score = 0;
        }
      } else if (q1.questionType === QuestionType.OPEN_ENDED) {
        if (!q1UserAnswer?.answerText) {
          q1Score = 0;
        } else if (!storyData.storyText) {
          q1Score = null;
          console.error('Missing story text for Q1 ML call');
        } else {
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

    const q1AnsweredCorrectly = q1Score === 1;
    const q1AnswerWasNo = q1 &&
        userAnswersMap.get(q1.id)?.answerText.trim().toLowerCase() === 'no';

    for (const order of [2, 3, 4]) {
      const childQ = questionsInStory.find(q => q.orderInStory === order);
      if (!childQ) {
        console.warn(`Q${order} not found for story ${storyId}`);
        continue;
      }

      const childUserAnswer = userAnswersMap.get(childQ.id);
      let childScore: number|null = null;


      if (storyData.storyType === StoryType.CONTROL && q1AnsweredCorrectly &&
          q1AnswerWasNo) {
        if (childUserAnswer) {
          childScore = 0;
          console.log(
              `Control Story ${storyId}, Q${order}: Answered (final score 0).`);
        } else {
          console.log(`Control Story ${storyId}, Q${
              order}: Not answered (final score 1).`);

          evaluatedResults.push({questionId: childQ.id, score: null});
          continue;
        }
      }

      else if (q1AnsweredCorrectly) {
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
        } else if (childQ.questionType === QuestionType.OPEN_ENDED) {
          if (!childUserAnswer?.answerText) {
            childScore = 0;
          } else if (!storyData.storyText) {
            childScore = null;
            console.error('Missing story for ML call');
          } else {
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
      } else {
        childScore = 0;
      }
      evaluatedResults.push({questionId: childQ.id, score: childScore});
    }

    for (const order of [5, 6]) {
      const q_independent =
          questionsInStory.find(q => q.orderInStory === order);
      if (!q_independent) {
        console.warn(`Q${order} not found for story ${storyId}`);
        continue;
      }
      const userAnswer = userAnswersMap.get(q_independent.id);
      let score_independent: number|null = 0;

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

    controlQs.forEach(cq => {
      const userAnswer = userAnswersMap.get(cq.id);
      if (userAnswer) {
        evaluatedResults.push({
          questionId: cq.id,
          score: isAnswerCorrect(
                     userAnswer.answerText, cq.correctAnswer, cq.questionType) ?
              1 :
              0
        });
      }
    });
  }

  for (const result of evaluatedResults) {
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
      console.warn(`Tried to update evaluation for Q_ID ${
          result.questionId} but no UserAnswer found. Score was: ${
          result.score}`);
    }
  }
  return evaluatedResults;
}