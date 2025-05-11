// prisma/seed.ts
import {PrismaClient, Question, QuestionType, Story, StoryType} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // 1. Create Question Group
  const fauxPasShortQuestionsGroup = await prisma.questionGroup.create({
    data: {
      name: 'Faux Pas Questions Short Version',
    },
  });

  // --- Story Data Structure ---
  // We'll define stories and their questions together for clarity
  const storiesData = [
    // --- Story 2 (Faux Pas) ---
    {
      storyNumber: 2,
      storyType: StoryType.FAUX_PAS,
      storyText:
          'Helen’s husband was throwing a surprise party for her birthday. He invited Sarah, a friend of Helen’s, and said, "Don’t tell anyone, especially Helen." The day before the party, Helen was over at Sarah’s and Sarah spilled some coffee on a new dress that was hanging over her chair. "Oh!" said Sarah, "I was going to wear this to your party!"  "What party?" said Helen.  "Come on," said Sarah, "Let’s go see if we can get the stain out." ',
      questions: [
        {
          order: 1,
          text:
              'Did anyone say something they shouldn’t have said or something awkward?',
          type: QuestionType.BOOLEAN,
          correctAnswer: 'Yes'
        },
        {
          order: 2,
          text:
              'Who said something they shouldn’t have said or something awkward?',
          type: QuestionType.MULTIPLE_CHOICE,
          choices: ['Sarah', 'Helen', 'Nobody'],
          correctAnswer: 'Sarah'
        },
        {
          order: 3,
          text: 'Why shouldn’t he/she have said it or why was it awkward?',
          type: QuestionType.OPEN_ENDED,
          correctAnswer: null
        },  // Evaluated by ML
        {
          order: 4,
          text: 'Why do you think he/she said it?',
          type: QuestionType.OPEN_ENDED,
          correctAnswer: null
        },  // Evaluated by ML
        {
          order: 5,
          text: 'Did Sarah remember that the party was a surprise party?',
          type: QuestionType.BOOLEAN,
          correctAnswer: 'No'
        },
        {
          order: 6,
          text: 'How do you think Helen felt? (Select all that apply)',
          type: QuestionType.MULTIPLE_CHOICE,
          choices: [
            'Happy',       'Excited',      'Surprised',     'Embarrassed',
            'Confused',    'Annoyed',      'Hopeful',       'Sad',
            'Angry',       'Feared',       'Frustrated',    'Guilty',
            'Tired',       'Lonely',       'Relieved',      'Relaxed',
            'Indifferent', 'Disappointed', 'Uncomfortable', 'Hurt'
          ],
          correctAnswer: JSON.stringify([
            'Surprised', 'Confused', 'Hurt', 'Disappointed', 'Uncomfortable'
          ])
        },  // Example correct answers
        {
          order: 7,
          text: 'In the story, who was the surprise party for?',
          type: QuestionType.MULTIPLE_CHOICE,
          choices: ['Helen', 'Sarah', 'The family'],
          correctAnswer: 'Helen',
          isControl: true
        },
        {
          order: 8,
          text: 'What got spilled on the dress?',
          type: QuestionType.MULTIPLE_CHOICE,
          choices: ['Coffee', 'Tea', 'Wine', 'Water'],
          correctAnswer: 'Coffee',
          isControl: true
        },
      ],
    },
    // --- Story 3 (Control) ---
    {
      storyNumber: 3,
      storyType: StoryType.CONTROL,
      storyText:
          'Jim was shopping for a shirt to match his suit. The salesman showed him several shirts. Jim looked at them and finally found one that was the right colour. But when he went to the fitting room and tried it on, it didn’t fit. "I’m afraid it’s too small," he said to the salesman.  "Not to worry," the salesman said. "We’ll get some in next week in a larger size."  "Great. I’ll just come back then," Jim said.',
      questions: [
        {
          order: 1,
          text:
              'Did anyone say something they shouldn’t have said or something awkward?',
          type: QuestionType.BOOLEAN,
          correctAnswer: 'No'
        },
        {
          order: 2,
          text:
              'Who said something they shouldn’t have said or something awkward?',
          type: QuestionType.MULTIPLE_CHOICE,
          choices: ['Jim', 'Salesman', 'Nobody'],
          correctAnswer: 'Nobody'
        },
        {
          order: 3,
          text: 'Why shouldn’t he/she have said it or why was it awkward?',
          type: QuestionType.OPEN_ENDED,
          correctAnswer: null
        },  // N/A if Q1 is No
        {
          order: 4,
          text: 'Why do you think he/she said it?',
          type: QuestionType.OPEN_ENDED,
          correctAnswer: null
        },  // N/A if Q1 is No
        {
          order: 5,
          text:
              'When he tried on the shirt, did Jim know they didn’t have it in his size?',
          type: QuestionType.BOOLEAN,
          correctAnswer: 'No'
        },  // He found out when trying it on
        {
          order: 6,
          text: 'How do you think Jim felt? (Select all that apply)',
          type: QuestionType.MULTIPLE_CHOICE,
          choices: [
            'Happy',       'Excited',      'Surprised',     'Embarrassed',
            'Confused',    'Annoyed',      'Hopeful',       'Sad',
            'Angry',       'Feared',       'Frustrated',    'Guilty',
            'Tired',       'Lonely',       'Relieved',      'Relaxed',
            'Indifferent', 'Disappointed', 'Uncomfortable', 'Hurt'
          ],
          correctAnswer:
              JSON.stringify(['Hopeful', 'Disappointed', 'Frustrated'])
        },  // Example
        {
          order: 7,
          text: 'In the story, what was Jim shopping for?',
          type: QuestionType.MULTIPLE_CHOICE,
          choices: ['Shirt', 'Tie', 'Pants'],
          correctAnswer: 'Shirt',
          isControl: true
        },
        {
          order: 8,
          text: 'Why was he going to come back next week?',
          type: QuestionType.MULTIPLE_CHOICE,
          choices: [
            'To try a larger size', 'To buy another shirt',
            'To return the shirt'
          ],
          correctAnswer: 'To try a larger size',
          isControl: true
        },
      ],
    },

  ];

  // Store created question IDs mapped by storyNumber and order
  const questionIds: Record<number, Record<number, number>> =
      {};  // { storyNum: { order: questionId } }

  // 2. Create Stories and Questions
  for (const storyData of storiesData) {
    const story = await prisma.story.upsert({
      where: {storyNumber: storyData.storyNumber},
      update: {storyType: storyData.storyType},
      create: {
        storyText: storyData.storyText,
        storyType: storyData.storyType,
      },
    });
    console.log(`Upserted Story ${storyData.storyNumber} (ID: ${
        story.id}, Type: ${story.storyType})`);

    questionIds[storyData.storyNumber] = {};
    let parentQ1Id: number|null = null;

    for (const qData of storyData.questions) {
      const question: Question = await prisma.question.upsert({
        where: {
          storyId_orderInStory: {
            // Use the Prisma-generated compound key name
            storyId: story.id,
            orderInStory: qData.order
          }
        },
        update: {
          // Data to update if found
          questionText: qData.text,
          questionType: qData.type,
          groupId: fauxPasShortQuestionsGroup.id,
          choices: qData.choices || [],
          isControl: qData.isControl || false,
          correctAnswer: qData.correctAnswer,
          // Update parent if needed (though should be set on create)
          parentQuestionId:
              (qData.order === 2 || qData.order === 3 || qData.order === 4) ?
              parentQ1Id :
              null,
        },
        create: {
          // Data to create if not found
          questionText: qData.text,
          questionType: qData.type,
          groupId: fauxPasShortQuestionsGroup.id,
          storyId: story.id,
          orderInStory: qData.order,
          choices: qData.choices || [],
          isControl: qData.isControl || false,
          correctAnswer: qData.correctAnswer,
          // Set parent for Q2, Q3, Q4 based on Q1 ID captured below
          parentQuestionId:
              (qData.order === 2 || qData.order === 3 || qData.order === 4) ?
              parentQ1Id :
              null,
        },
      });
      console.log(`  Upserted Question ${qData.order} (ID: ${question.id}): ${
          qData.text.substring(0, 30)}...`);

      questionIds[storyData.storyNumber][qData.order] = question.id;

      // Capture the ID of Q1 to link children
      if (qData.order === 1) {
        parentQ1Id = question.id;
      }
    }
    // Re-update children Q2, Q3, Q4 just in case parentQ1Id wasn't available on
    // initial create pass (e.g., if Q1 wasn't the very first upsert for some
    // reason, although unlikely here)
    if (parentQ1Id) {
      for (const order of [2, 3, 4]) {
        if (questionIds[storyData.storyNumber][order]) {
          await prisma.question.update({
            where: {id: questionIds[storyData.storyNumber][order]},
            data: {parentQuestionId: parentQ1Id},
          });
        }
      }
    }
  }

  // 3. Set Up Flow Logic
  console.log('Setting up flow logic...');
  for (let i = 0; i < storiesData.length; i++) {
    const currentStoryNum = storiesData[i].storyNumber;
    const nextStoryNum =
        (i + 1 < storiesData.length) ? storiesData[i + 1].storyNumber : null;
    const currentStoryQIds = questionIds[currentStoryNum];

    if (!currentStoryQIds) {
      console.warn(`Skipping flow for story ${
          currentStoryNum}, question IDs not found.`);
      continue;
    }

    // Flow for Q1 (Boolean)
    await prisma.question.update({
      where: {id: currentStoryQIds[1]},
      data: {
        flowYes: currentStoryQIds[2],  // Go to Q2 (Who?) if Yes
        flowNo: currentStoryQIds[5],   // Go to Q5 (Belief) if No
      },
    });

    // Flow for Q2 -> Q3
    if (currentStoryQIds[2])
      await prisma.question.update({
        where: {id: currentStoryQIds[2]},
        data: {flowYes: currentStoryQIds[3]}
      });
    // Flow for Q3 -> Q4
    if (currentStoryQIds[3])
      await prisma.question.update({
        where: {id: currentStoryQIds[3]},
        data: {flowYes: currentStoryQIds[4]}
      });
    // Flow for Q4 -> Q5
    if (currentStoryQIds[4])
      await prisma.question.update({
        where: {id: currentStoryQIds[4]},
        data: {flowYes: currentStoryQIds[5]}
      });

    // Flow for Q5 -> Q6
    if (currentStoryQIds[5])
      await prisma.question.update({
        where: {id: currentStoryQIds[5]},
        data: {flowYes: currentStoryQIds[6]}
      });
    // Flow for Q6 -> Q7 (Control 1)
    if (currentStoryQIds[6])
      await prisma.question.update({
        where: {id: currentStoryQIds[6]},
        data: {flowYes: currentStoryQIds[7]}
      });
    // Flow for Q7 -> Q8 (Control 2)
    if (currentStoryQIds[7])
      await prisma.question.update({
        where: {id: currentStoryQIds[7]},
        data: {flowYes: currentStoryQIds[8]}
      });

    // Flow for Q8 -> Next Story Q1 (or null if last story)
    const nextStoryQ1Id = nextStoryNum ? questionIds[nextStoryNum]?.[1] : null;
    if (currentStoryQIds[8])
      await prisma.question.update({
        where: {id: currentStoryQIds[8]},
        data: {flowYes: nextStoryQ1Id}
      });  // Link to next story or null

    console.log(`Flow updated for Story ${currentStoryNum}`);
  }

  console.log('Seeding finished successfully!');
}


main()
    .catch((e) => {
      console.error('Error during seeding:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });