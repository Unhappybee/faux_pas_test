import {PrismaClient, Question, Story, StoryType, UserAnswer} from '@prisma/client';

const prisma = new PrismaClient();

interface EvaluationData {
  userId: number;
  answers: (UserAnswer&{
    question: Question&{story: Story | null};
  })[];
}

export interface FinalScores {
  userId: number;
  correctControlQsFp:
      number;  // Total correct control Qs (Q7,Q8) for Faux Pas stories
  correctControlQsControl:
      number;  // Total correct control Qs (Q7,Q8) for Control stories
  maxControlQsFp:
      number;  // Max possible score for control Qs in FP stories user attempted
  maxControlQsControl: number;  // Max possible score for control Qs in Control
                                // stories user attempted
  validStoriesCount: number;    // Number of stories used in ratio calculations
                                // (after excluding invalid ones)
  invalidStoriesCount:
      number;  // Number of stories excluded due to failed control questions
  fauxPasDetectionRatio: number|
      null;  // Ratio for detecting faux pas (Q1+Q2 for FP, Q1+Q2-not-answered
             // for Control)
  understandingInappropriatenessRatio: number|
      null;  // Ratio for understanding why (Q3 for FP, Q3-not-answered for
             // Control)
  intentionsRatio: number|null;  // Ratio for understanding intentions (Q4 for
                                 // FP, Q4-not-answered for Control)
  beliefRatio: number|null;   // Ratio for understanding beliefs (Q5 for both)
  empathyRatio: number|null;  // Ratio for understanding emotions (Q6 for both)
}


// Helper to retrieve the evaluation score (0 or 1) for a specific question
// within a specific story from the user's evaluated answers.
function getScore(
    answers: EvaluationData['answers'],  // All evaluated answers for the user
    storyId: number,  // The ID of the story we're interested in
    questionOrder:
        number  // The order of the question within that story (e.g., 1 for Q1)
    ): number|null|
    undefined {  // Returns the score (0 or 1), null if evaluation was null, or
                 // undefined if no such answer
  const answer = answers.find(
      a => a.question.storyId === storyId &&         // Match the story
          a.question.orderInStory === questionOrder  // Match the question order
  );
  // `answer.evaluation` holds the score (0, 1, -1 for invalid, or null if not
  // scored/applicable) For ratio calculations, we primarily care about 0 vs 1.
  return answer?.evaluation;
}

// Helper to check if a user provided *any* answer for a specific question
// within a specific story. This is crucial for Control Story Q2, Q3, Q4
// scoring.
function wasAnswered(
    answers: EvaluationData['answers'],  // All evaluated answers for the user
    storyId: number,                     // The ID of the story
    questionOrder: number                // The order of the question
    ): boolean {  // Returns true if an answer record exists, false otherwise
  return answers.some(
      a => a.question.storyId === storyId &&
          a.question.orderInStory === questionOrder);
}

export async function calculateFinalScoresForUser(userId: number):
    Promise<FinalScores> {
  const userAnswers = await prisma.userAnswer.findMany({
    where: {userId: userId},
    include: {
      question: {
        include: {
          story: true,
        },
      },
    },
  });

  if (!userAnswers || userAnswers.length === 0) {
    throw new Error(
        `No answers found for user ID ${userId} to calculate final scores.`);
  }

  const evaluationData: EvaluationData = {userId, answers: userAnswers};

  const answersByStory = new Map<number, EvaluationData['answers']>();
  for (const answer of evaluationData.answers) {
    if (answer.question.storyId) {
      if (!answersByStory.has(answer.question.storyId)) {
        answersByStory.set(answer.question.storyId, []);
      }
      answersByStory.get(answer.question.storyId)!.push(answer);
    }
  }

  let correctControlQsFp = 0;       // Correct control Qs for Faux Pas stories
  let correctControlQsControl = 0;  // Correct control Qs for Control stories
  let maxControlQsFp =
      0;  // Maximum possible control Q score for FP stories attempted
  let maxControlQsControl =
      0;  // Maximum possible control Q score for Control stories attempted
  const invalidStoryIds =
      new Set<number>();  // Stores IDs of stories to exclude from ratio scoring

  let numValidFpStories = 0;
  let numValidControlStories = 0;

  for (const [storyId, storyAnswersForThisStory] of answersByStory.entries()) {
    const story = storyAnswersForThisStory[0]?.question.story;
    if (!story) {  // Safety check, should not happen if data is consistent
      console.warn(`Story data missing for story ID ${
          storyId} during control question check. Skipping story.`);
      continue;
    }

    let storyControlCorrect = 0;  // Number of correctly answered control
                                  // questions for *this specific story*
    let storyControlTotal = 0;  // Total number of control questions encountered
                                // for *this specific story*
    let hasControlError = false;  // Flag to indicate if *any* control question
                                  // for this story was answered incorrectly
    const controlQuestionAnswers =
        storyAnswersForThisStory.filter(a => a.question.isControl);

    controlQuestionAnswers.forEach(controlAnswer => {
      storyControlTotal++;  // Increment total control questions for this story
      if (controlAnswer.evaluation ===
          1) {  // `evaluation` field was set by `evaluateUserTest`
        storyControlCorrect++;
      } else {
        hasControlError = true;
        console.log(`User ${userId}, Story ${storyId}: Control question ${
            controlAnswer.question.orderInStory ||
            controlAnswer.questionId} failed (Score: ${
            controlAnswer.evaluation}).`);
      }
    });

    if (story.storyType === StoryType.FAUX_PAS) {
      maxControlQsFp += storyControlTotal;
    } else if (story.storyType === StoryType.CONTROL) {
      maxControlQsControl += storyControlTotal;
    }

    if (hasControlError) {
      invalidStoryIds.add(storyId);
    } else {
      if (story.storyType === StoryType.FAUX_PAS) {
        correctControlQsFp += storyControlCorrect;
      } else if (story.storyType === StoryType.CONTROL) {
        correctControlQsControl += storyControlCorrect;
      }
    }
  }
  console.log(
      `User ${userId}: Invalid stories due to failed control questions: [${
          Array.from(invalidStoryIds).join(', ')}]`);

  let detectionScoreFp = 0;         // Q1+Q2 scores for Faux Pas stories
  let detectionScoreControlQ1 = 0;  // Q1 score for Control stories
  let detectionScoreControlQ2 =
      0;  // Q2 (not answered) score for Control stories

  let understandingScoreFp = 0;  // Q3 scores for Faux Pas stories
  let understandingScoreControl =
      0;  // Q3 (not answered) score for Control stories

  let intentionsScoreFp = 0;  // Q4 scores for Faux Pas stories
  let intentionsScoreControl =
      0;  // Q4 (not answered) score for Control stories

  let beliefScoreTotal = 0;   // Q5 scores for ALL valid stories
  let empathyScoreTotal = 0;  // Q6 scores for ALL valid stories

  // Iterate through each story's answers again.
  for (const [storyId, storyAnswersForThisStory] of answersByStory.entries()) {
    if (invalidStoryIds.has(storyId)) {
      continue;
    }

    const story = storyAnswersForThisStory[0]?.question.story;
    if (!story) {  // Safety check
      console.warn(`Story data missing for story ID ${
          storyId} during ratio calculation. Skipping story.`);
      continue;
    }

    // Get the evaluated score for Q1 of the current story.
    const q1Score = getScore(evaluationData.answers, storyId, 1);

    // --- Faux Pas Detection Score Components ---
    if (story.storyType === StoryType.FAUX_PAS) {
      // For Faux Pas stories:
      // Point for correctly identifying the faux pas (Q1).
      if (q1Score === 1) detectionScoreFp += 1;
      // Point for correctly identifying who said it (Q2), *only if Q1 was also
      // correct*.
      const q2Score = getScore(evaluationData.answers, storyId, 2);
      if (q1Score === 1 && q2Score === 1) detectionScoreFp += 1;
    } else if (story.storyType === StoryType.CONTROL) {
      // For Control stories:
      // Point if Q1 was correctly answered "No" (i.e., `q1Score` is 1).
      if (q1Score === 1) {
        detectionScoreControlQ1 += 1;
        // Point for Q2 if Q1 was correct ("No") AND Q2 was *not* answered.
        if (!wasAnswered(evaluationData.answers, storyId, 2)) {
          detectionScoreControlQ2 += 1;
        }
      }
    }

    if (story.storyType === StoryType.FAUX_PAS) {
      const q3Score = getScore(evaluationData.answers, storyId, 3);
      if (q1Score === 1 && q3Score === 1) understandingScoreFp += 1;
    } else if (story.storyType === StoryType.CONTROL) {
      if (q1Score === 1 && !wasAnswered(evaluationData.answers, storyId, 3)) {
        understandingScoreControl += 1;
      }
    }

    if (story.storyType === StoryType.FAUX_PAS) {
      const q4Score = getScore(evaluationData.answers, storyId, 4);
      if (q1Score === 1 && q4Score === 1) intentionsScoreFp += 1;
    } else if (story.storyType === StoryType.CONTROL) {
      if (q1Score === 1 && !wasAnswered(evaluationData.answers, storyId, 4)) {
        intentionsScoreControl += 1;
      }
    }


    const q5Score = getScore(evaluationData.answers, storyId, 5);
    if (q5Score === 1) beliefScoreTotal += 1;

    const q6Score = getScore(evaluationData.answers, storyId, 6);
    if (q6Score === 1) empathyScoreTotal += 1;
  }


  const denominator = correctControlQsFp + correctControlQsControl;
  const validStoriesCount = answersByStory.size - invalidStoryIds.size;

  // Helper function to safely divide, returning null if denominator is zero to
  // avoid errors.
  const safeDivide =
      (numerator: number, denominatorToUse: number): number|null => {
        if (denominatorToUse === 0) return null;
        return numerator / denominatorToUse;
      };

  // Sum up the components for each main score type.
  const totalDetectionScore =
      detectionScoreFp + detectionScoreControlQ1 + detectionScoreControlQ2;
  const totalUnderstandingScore =
      understandingScoreFp + understandingScoreControl;
  const totalIntentionsScore = intentionsScoreFp + intentionsScoreControl;

  // Construct the final scores object.
  const finalScores: FinalScores = {
    userId: userId,
    correctControlQsFp: correctControlQsFp,
    correctControlQsControl: correctControlQsControl,
    maxControlQsFp: maxControlQsFp,
    maxControlQsControl: maxControlQsControl,
    validStoriesCount: answersByStory.size -
        invalidStoryIds.size,  // Total stories minus invalid ones
    invalidStoriesCount: invalidStoryIds.size,
    fauxPasDetectionRatio: safeDivide(totalDetectionScore, denominator),
    understandingInappropriatenessRatio:
        safeDivide(totalUnderstandingScore, validStoriesCount),
    intentionsRatio: safeDivide(totalIntentionsScore, validStoriesCount),
    beliefRatio: safeDivide(beliefScoreTotal, validStoriesCount),
    empathyRatio: safeDivide(empathyScoreTotal, validStoriesCount),
  };

  return finalScores;
}