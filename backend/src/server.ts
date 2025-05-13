import {PrismaClient} from '@prisma/client';
import cors from 'cors';
import express from 'express';

import {evaluateUserTest} from './evaluation';
import {calculateFinalScoresForUser, FinalScores} from './final_score'

const app = express();
const prisma = new PrismaClient();
app.use(cors({origin: '*'}));
app.use(express.json());

// Route to create a new story
app.post('/stories', async (req, res) => {
  try {
    const {storyText, storyType} = req.body;

    const story = await prisma.story.create({
      data: {storyText, storyType},
    });

    res.status(201).json(story);
  } catch (error) {
    res.status(500).json({error: 'Failed to create story'});
  }
});

// Route to get all stories
app.get('/stories', async (req, res) => {
  try {
    const stories = await prisma.story.findMany();
    res.status(200).json(stories);
  } catch (error) {
    res.status(500).json({error: 'Failed to fetch stories'});
  }
});

// Route to create a new question
app.post('/questions', async (req, res) => {
  try {
    const {
      questionText,
      questionType,
      groupId,
      flowYes,
      flowNo,
      storyId,
      orderInStory
    } = req.body;

    const question = await prisma.question.create({
      data: {
        questionText,
        questionType,
        groupId,
        flowYes,
        flowNo,
        storyId,
        orderInStory
      },
    });

    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({error: 'Failed to create question'});
  }
});

// Route to get all questions
app.get('/questions', async (req, res) => {
  try {
    const questions = await prisma.question.findMany({
      orderBy: {
        id: 'asc',
      },
    });
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({error: 'Failed to fetch questions'});
  }
});



// Route to create or update an answer for a question
app.post('/answers', async (req, res) => {
  const {userId, questionId, answerText: rawAnswerText} = req.body;
  const finalAnswerText =
      (rawAnswerText === null || rawAnswerText === undefined) ?
      '' :
      String(rawAnswerText);
  if (userId === undefined || userId === null || isNaN(Number(userId))) {
    console.error('Validation Error: Missing or invalid userId');
  }
  if (questionId === undefined || questionId === null ||
      isNaN(Number(questionId))) {
    console.error('Validation Error: Missing or invalid questionId');
  }

  try {
    console.log(`Attempting to create/update answer for User: ${
        userId}, Question: ${questionId}`);


    const userAnswer = await prisma.userAnswer.upsert({
      where: {
        // The unique identifier for an answer
        userId_questionId: {
          userId: Number(userId),
          questionId: Number(questionId),
        },
      },
      update: {

        answerText: finalAnswerText,

      },
      create: {

        answerText: finalAnswerText,

        user: {connect: {id: Number(userId)}},
        question: {connect: {id: Number(questionId)}}

      },
      include: {question: true, user: true}
    });

    console.log('UserAnswer created/updated successfully:', userAnswer.id);
    res.status(201).json(userAnswer);

  } catch (error: any) {
    console.error('Error creating/updating UserAnswer:', error);


    if (error.code === 'P2002') {
      res.status(409).json({
        error:
            'Conflict: Answer likely already exists (though upsert should handle this).'
      });
    } else if (error.code === 'P2025') {
      res.status(404).json(
          {error: 'Not Found: User or Question does not exist.'});
    } else {
      res.status(500).json(
          {error: 'Failed to save answer due to an internal error.'});
    }
  }
});

// Route to trigger evaluation and calculate final scores
app.post('/users/:userId/calculate-scores', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);

  if (isNaN(userId)) {
    console.log(`[User ${userId}]  Invalid userId: ${userId}`);
  }

  try {
    console.log(`[User ${userId}] Received POST request to /users/${
        userId}/calculate-scores`);


    console.log(`[User ${userId}] Starting individual answer evaluation...`);
    await evaluateUserTest(userId /*, prisma, PYTHON_API_URL */);
    console.log(`[User ${userId}] Individual answer evaluation complete.`);


    console.log(`[User ${userId}] Calculating final scores...`);
    const finalScores = await calculateFinalScoresForUser(userId /*, prisma */);
    console.log(`[User ${userId}] Final score calculation complete.`);

    res.status(200).json(finalScores);

  } catch (error: any) {
    console.error(`[User ${userId}] Error processing scores:`, error);
    res.status(500).json(
        {error: 'An internal error occurred while calculating scores.'});
  }
});


// Route to get answers of a specific user
app.get('/answers/:userId', async (req, res) => {
  const {userId} = req.params;

  try {
    const answers = await prisma.userAnswer.findMany({
      where: {userId: parseInt(userId)},
      include: {
        question: true,
      },
    });

    res.status(200).json(answers);
  } catch (error) {
    res.status(500).json({error: 'Failed to fetch answers'});
  }
});


// Route to create a new user
app.post('/users', async (req, res) => {
  const {username} = req.body;

  try {
    const user = await prisma.user.create({
      data: {
        username,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({error: 'Failed to create user'});
  }
});

// Route to get all groups wasn't used in the frontend
// but can be used to fetch all groups.
app.get('/groups', async (req, res) => {
  try {
    const groups = await prisma.questionGroup.findMany({
      orderBy: {
        id: 'desc',
      },
    });
    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({error: 'Failed to fetch groups'});
  }
});

// Route to get all questions for a specific group
app.get('/questions/group/:groupId', async (req, res) => {
  const {groupId} = req.params;

  try {
    const questions = await prisma.question.findMany({
      where: {groupId: parseInt(groupId)},
      orderBy: {
        id: 'asc',
      },
      include: {story: true},
    });

    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({error: 'Failed to fetch questions for the group'});
  }
});


// Start the server
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
