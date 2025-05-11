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
  const storiesData =
      [
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
              choices: ['Helen', 'Sarah', 'The husband', 'Nobody'],
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
                'Surprised',
                'Confused',
                'Hurt',
                'Disappointed',
                'Uncomfortable',
                'Angry',
                'Happy',
                'Annoyed',
                'Sad',
                'Excited',
                'Frustrated',
              ])
            },  // Example correct answers
            {
              order: 7,
              text: 'In the story, who was the surprise party for?',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: ['Sarah', 'The family', 'Helen', 'The husband'],
              correctAnswer: 'Helen',
              isControl: true
            },
            {
              order: 8,
              text: 'What got spilled on the dress?',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: ['Tea', 'Coffee', 'Wine', 'Water'],
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
              correctAnswer: JSON.stringify([
                'Hopeful', 'Disappointed', 'Frustrated', 'Relaxed', 'Happy',
                'Surprised', 'Annoyed', 'Embarrassed', 'Confused', 'Angry',
                'Uncomfortable', 'Sad'
              ])
            },  // Example
            {
              order: 7,
              text: 'In the story, what was Jim shopping for?',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: ['Shirt', 'Tie', 'Pants', 'Jacket', 'Suit'],
              correctAnswer: 'Shirt',
              isControl: true
            },
            {
              order: 8,
              text: 'Why was he going to come back next week?',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: [
                'To buy a new suit', 'To look around', 'To try a larger size',
                'To buy another shirt', 'To return the shirt'
              ],
              correctAnswer: 'To try a larger size',
              isControl: true
            },
          ],
        },
        // --- Story 6 (Control) ---
        {
          storyNumber: 6,
          storyType: StoryType.CONTROL,
          storyText:
              'John stopped off at the petrol station on the way home to fill up his car. He gave the cashier his credit card. The cashier ran it through the machine at the counter. "I’m sorry," she said, "the machine won’t accept your card."  "Hmmm, that’s funny," John said. "Well, I’ll just pay in cash."  He gave her fifty and said, "I filled up the tank with unleaded." ',
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
              choices: ['John', 'Cashier', 'Nobody'],
              correctAnswer: 'Nobody'
            },
            {
              order: 3,
              text: 'Why shouldn’t he/she have said it or why was it awkward?',
              type: QuestionType.OPEN_ENDED,
              correctAnswer: null
            },
            {
              order: 4,
              text: 'Why do you think he/she said it?',
              type: QuestionType.OPEN_ENDED,
              correctAnswer: null
            },
            {
              order: 5,
              text:
                  'When he handed his card to the cashier, did John know the machine wouldn’t take his card?',
              type: QuestionType.BOOLEAN,
              correctAnswer: 'No'
            },
            {
              order: 6,
              text: 'How do you think John felt? (Select all that apply)',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: [
                'Happy',       'Excited',      'Surprised',     'Embarrassed',
                'Confused',    'Annoyed',      'Hopeful',       'Sad',
                'Angry',       'Feared',       'Frustrated',    'Guilty',
                'Tired',       'Lonely',       'Relieved',      'Relaxed',
                'Indifferent', 'Disappointed', 'Uncomfortable', 'Hurt'
              ],
              correctAnswer: JSON.stringify([
                'Surprised', 'Embarrassed', 'Annoyed', 'Frustrated', 'Confused',
                'Sad', 'Angry', 'Uncomfortable', 'Disappointed', 'Guilty',
                'Happy'
              ])
            },  // Example
            {
              order: 7,
              text: 'In the story, what did John stop off to buy?',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: ['Food', 'A car wash', 'Petrol', 'Snacks'],
              correctAnswer: 'Petrol',
              isControl: true
            },
            {
              order: 8,
              text: 'Why did he pay in cash?',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: [
                'He didn’t have a credit card', 'He wanted to save money',
                'The machine declined his card', 'He forgot his PIN',
                'He preferred cash'
              ],
              correctAnswer: 'The machine declined his card',
              isControl: true
            },
          ],
        },
        // --- Story 8 (Control) ---
        {
          storyNumber: 8,
          storyType: StoryType.CONTROL,
          storyText:
              'Joan took her dog, Zack, out to the park. She threw a stick for him to chase.  When they had been there a while, Pam, a neighbour of hers, passed by. They chatted for a few minutes. Then Pam asked, "Are you heading home? Would you like to walk together?"  "Sure," Joan said. She called Zack, but he was busy chasing pigeons and didn’t come. "It looks like he’s not ready to go," she said. "I think we’ll stay."  "OK," Pam said. "I’ll see you later." ',
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
              choices: ['Joan', 'Pam', 'Zack', 'Nobody'],
              correctAnswer: 'Nobody'
            },
            {
              order: 3,
              text: 'Why shouldn’t he/she have said it or why was it awkward?',
              type: QuestionType.OPEN_ENDED,
              correctAnswer: null
            },
            {
              order: 4,
              text: 'Why do you think he/she said it?',
              type: QuestionType.OPEN_ENDED,
              correctAnswer: null
            },
            {
              order: 5,
              text:
                  'When she invited her, did Pam know that Joan wouldn’t be able to walk home with her?',
              type: QuestionType.BOOLEAN,
              correctAnswer: 'No'
            },
            {
              order: 6,
              text: 'How do you think Pam felt? (Select all that apply)',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: [
                'Happy',       'Excited',      'Surprised',     'Embarrassed',
                'Confused',    'Annoyed',      'Hopeful',       'Sad',
                'Angry',       'Feared',       'Frustrated',    'Guilty',
                'Tired',       'Lonely',       'Relieved',      'Relaxed',
                'Indifferent', 'Disappointed', 'Uncomfortable', 'Hurt'
              ],
              correctAnswer: JSON.stringify([
                'Indifferent', 'Relaxed', 'Understanding', 'Lonely', 'Annoyed',
                'Disappointed', 'Sad'
              ])
            },  // Example
            {
              order: 7,
              text: 'In the story, where had Joan taken Zack?',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: [
                'To the museum', 'To the park', 'To the store', 'To the vet'
              ],
              correctAnswer: 'To the park',
              isControl: true
            },
            {
              order: 8,
              text: 'Why didn’t she walk with her friend Pam?',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: [
                'She was busy', 'She was going home',
                'She had to go somewhere else'
              ],
              correctAnswer: 'Zack was chasing pigeons',
              isControl: true
            },
          ],
        },
        // --- Story 11 (Faux Pas) ---
        {
          storyNumber: 11,
          storyType: StoryType.FAUX_PAS,
          storyText:
              'Jean West, a manager in Abco Software Design, called a meeting for all of the staff. "I have something to tell you," she said. "John Morehouse, one of our accountants, is very sick with cancer and he’s in hospital."  Everyone was quiet, absorbing the news, when Robert, a software engineer, arrived late. "Hey, I heard this great joke last night!” Robert said. “What did the terminally ill patient say to his doctor?" Jean said, "Okay, let’s get down to business in the meeting."',
          questions:
              [
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
                  choices: ['Robert', 'Jean', 'Joan', 'Nobody'],
                  correctAnswer: 'Robert'
                },
                {
                  order: 3,
                  text:
                      'Why shouldn’t he/she have said it or why was it awkward?',
                  type: QuestionType.OPEN_ENDED,
                  correctAnswer: null
                },
                {
                  order: 4,
                  text: 'Why do you think he/she said it?',
                  type: QuestionType.OPEN_ENDED,
                  correctAnswer: null
                },
                {
                  order: 5,
                  text:
                      'When he came in, did Robert know that the accountant was sick with cancer?',
                  type: QuestionType.BOOLEAN,
                  correctAnswer: 'No'
                },
                {
                  order: 6,
                  text:
                      'How do you think Jean, the manager, felt? (Select all that apply)',
                  type: QuestionType.MULTIPLE_CHOICE,
                  choices:
                      [
                        'Happy',         'Excited',     'Surprised',
                        'Embarrassed',   'Confused',    'Annoyed',
                        'Hopeful',       'Sad',         'Angry',
                        'Feared',        'Frustrated',  'Guilty',
                        'Tired',         'Lonely',      'Relieved',
                        'Relaxed',       'Indifferent', 'Disappointed',
                        'Uncomfortable', 'Hurt'
                      ],
                  correctAnswer:
                      JSON.stringify(
                          [
                            'Embarrassed', 'Annoyed', 'Angry', 'Frustrated',
                            'Uncomfortable', 'Hurt', 'Sad',
                            'Disappointed', 'Confused', 'Indifferent', 'Tired',
                            'Surprised'
                          ])
                },  // Example
                {
                  order: 7,
                  text:
                      'In the story, what did Jean, the manager, tell the people in the meeting?',
                  type: QuestionType.MULTIPLE_CHOICE,
                  choices:
                      [
                        'She was sick', 'Robert was sick',
                        'John Morehouse is sick with cancer',
                        'Robert was late to the meeting',
                        'The company is doing well'
                      ],
                  correctAnswer: 'John Morehouse is sick with cancer',
                  isControl: true
                },
                {
                  order: 8,
                  text: 'Who arrived late to the meeting?',
                  type: QuestionType.MULTIPLE_CHOICE,
                  choices: ['Jean', 'John', 'Robert'],
                  correctAnswer: 'Robert',
                  isControl: true
                },
              ],
        },
        // --- Story 12 (Faux Pas) ---
        {
          storyNumber: 12,
          storyType: StoryType.FAUX_PAS,
          storyText:
              'Mike, a nine-year-old boy, just started at a new school. He was in one of the cubicles in the toilets at school. Joe and Peter, two other boys, came in and were standing at the sinks talking. Joe said, "You know that new guy in the class? His name’s Mike. Doesn’t he look weird? And he’s so short!"  Mike came out of the cubicle and Joe and Peter saw him.  Peter said, "Oh hi, Mike! Are you going out to play football now?" ',
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
              choices: ['Joe', 'Peter', 'Nobody'],
              correctAnswer: 'Joe'
            },  // Joe made the comment, Peter tried to cover
            {
              order: 3,
              text: 'Why shouldn’t he/she have said it or why was it awkward?',
              type: QuestionType.OPEN_ENDED,
              correctAnswer: null
            },
            {
              order: 4,
              text: 'Why do you think he/she said it?',
              type: QuestionType.OPEN_ENDED,
              correctAnswer: null
            },
            {
              order: 5,
              text:
                  'When Joe was talking to Peter, did he know that Mike was in one of the cubicles?',
              type: QuestionType.BOOLEAN,
              correctAnswer: 'No'
            },
            {
              order: 6,
              text: 'How do you think Mike felt? (Select all that apply)',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: [
                'Happy',       'Excited',      'Surprised',     'Embarrassed',
                'Confused',    'Annoyed',      'Hopeful',       'Sad',
                'Angry',       'Feared',       'Frustrated',    'Guilty',
                'Tired',       'Lonely',       'Relieved',      'Relaxed',
                'Indifferent', 'Disappointed', 'Uncomfortable', 'Hurt'
              ],
              correctAnswer: JSON.stringify([
                'Embarrassed', 'Sad', 'Angry', 'Hurt', 'Uncomfortable',
                'Surprised', 'Confused', 'Feared', 'Frustrated', 'Disappointed',
                'Lonely'
              ])
            },  // Example
            {
              order: 7,
              text:
                  'In the story, where was Mike while Joe and Peter were talking?',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: [
                'At home', 'In the library', 'In a cubicle',
                'At the football field', 'In the classroom'
              ],
              correctAnswer: 'In a cubicle',
              isControl: true
            },
            {
              order: 8,
              text: 'What did Joe say about Mike?',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: [
                'He is a good student', 'He is a good friend',
                'He looks weird and is short', 'He is good at football',
                'He is quiet'
              ],
              correctAnswer: 'He looks weird and is short',
              isControl: true
            },
          ],
        },
        // --- Story 13 (Faux Pas) ---
        {
          storyNumber: 13,
          storyType: StoryType.FAUX_PAS,
          storyText:
              'Kim’s cousin, Scott, was coming to visit and Kim made an apple pie especially for him. After dinner, she said, "I made a pie just for you. It’s in the kitchen."  "Mmmm," replied Scott, "It smells great! I love pies, except for apple, of course." ',
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
              choices: ['Kim', 'Scott', 'Nobody'],
              correctAnswer: 'Scott'
            },
            {
              order: 3,
              text: 'Why shouldn’t he/she have said it or why was it awkward?',
              type: QuestionType.OPEN_ENDED,
              correctAnswer: null
            },
            {
              order: 4,
              text: 'Why do you think he/she said it?',
              type: QuestionType.OPEN_ENDED,
              correctAnswer: null
            },
            {
              order: 5,
              text:
                  'When he smelled the pie, did Scott know it was an apple pie?',
              type: QuestionType.BOOLEAN,
              correctAnswer: 'No'
            },
            {
              order: 6,
              text: 'How do you think Kim felt? (Select all that apply)',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: [
                'Happy',       'Excited',      'Surprised',     'Embarrassed',
                'Confused',    'Annoyed',      'Hopeful',       'Sad',
                'Angry',       'Feared',       'Frustrated',    'Guilty',
                'Tired',       'Lonely',       'Relieved',      'Relaxed',
                'Indifferent', 'Disappointed', 'Uncomfortable', 'Hurt'
              ],
              correctAnswer: JSON.stringify([
                'Hurt', 'Disappointed', 'Sad', 'Embarrassed', 'Uncomfortable',
                'Confused', 'Angry', 'Annoyed', 'Frustrated', 'Indifferent',
                'Guilty', 'Tired', 'Lonely'
              ])
            },  // Example
            {
              order: 7,
              text: 'In the story, what kind of pie did Kim make?',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: ['Carrot pie', 'Apple pie', 'Cherry pie', 'Pumpkin pie'],
              correctAnswer: 'Apple pie',
              isControl: true
            },
            {
              order: 8,
              text: 'How did Kim and Scott know each other?',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: [
                'They are married', 'They are siblings', 'They are cousins',
                'They are friends', 'They are colleagues'
              ],
              correctAnswer: 'They are cousins',
              isControl: true
            },
          ],
        },
        // --- Story 14 (Faux Pas) ---
        {
          storyNumber: 14,
          storyType: StoryType.FAUX_PAS,
          storyText:
              'Jeanette bought her friend, Anne, a crystal bowl for a wedding gift. Anne had a big wedding and there were a lot of presents to keep track of.  About a year later, Jeanette was over one night at Anne’s for dinner. Jeanette dropped a wine bottle by accident on the crystal bowl and the bowl shattered. "I’m really sorry. I’ve broken the bowl," said Jeanette.  "Don’t worry," said Anne. "I never liked it anyway. Someone gave it to me for my wedding." ',
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
              choices: ['Jeanette', 'Anne', 'Nobody'],
              correctAnswer: 'Anne'
            },
            {
              order: 3,
              text: 'Why shouldn’t he/she have said it or why was it awkward?',
              type: QuestionType.OPEN_ENDED,
              correctAnswer: null
            },
            {
              order: 4,
              text: 'Why do you think he/she said it?',
              type: QuestionType.OPEN_ENDED,
              correctAnswer: null
            },
            {
              order: 5,
              text: 'Did Anne remember that Jeanette had given her the bowl?',
              type: QuestionType.BOOLEAN,
              correctAnswer: 'No'
            },
            {
              order: 6,
              text: 'How do you think Jeanette felt? (Select all that apply)',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: [
                'Happy',       'Excited',      'Surprised',     'Embarrassed',
                'Confused',    'Annoyed',      'Hopeful',       'Sad',
                'Angry',       'Feared',       'Frustrated',    'Guilty',
                'Tired',       'Lonely',       'Relieved',      'Relaxed',
                'Indifferent', 'Disappointed', 'Uncomfortable', 'Hurt'
              ],
              correctAnswer: JSON.stringify([
                'Hurt', 'Embarrassed', 'Sad', 'Disappointed', 'Uncomfortable',
                'Surprised', 'Confused', 'Angry', 'Annoyed', 'Frustrated',
                'Guilty', 'Tired', 'Relieved', 'Relaxed'
              ])
            },  // Example
            {
              order: 7,
              text:
                  'In the story, what did Jeanette give Anne for her wedding?',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: [
                'A bottle of wine', 'A crystal bowl', 'A vase', 'A framed photo'
              ],
              correctAnswer: 'A crystal bowl',
              isControl: true
            },
            {
              order: 8,
              text: 'How did the bowl get broken?',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: [
                'Jeanette dropped it', 'Anne dropped it',
                'Jeanette dropped a wine bottle', 'Jeanette dropped the bowl',
                'Anne accidentally broke it'
              ],
              correctAnswer: 'Jeanette dropped a wine bottle',
              isControl: true
            },
          ],
        },
        // --- Story 17 (Control) ---
        {
          storyNumber: 17,
          storyType: StoryType.CONTROL,
          storyText:
              'Eleanor was waiting at the bus stop. The bus was late and she had been standing there a long time. She was 65 and it made her tired to stand for so long. When the bus finally came, it was crowded and there were no seats left. She saw a neighbour, Paul, standing in the aisle of the bus. "Hello, Eleanor," he said. "Were you waiting there long?"  "About 20 minutes," she replied.  A young man who was sitting down got up. "Ma’am, would you like my seat?" ',
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
              choices: ['Eleanor', 'Paul', 'The young man', 'Nobody'],
              correctAnswer: 'Nobody'
            },
            {
              order: 3,
              text: 'Why shouldn’t he/she have said it or why was it awkward?',
              type: QuestionType.OPEN_ENDED,
              correctAnswer: null
            },
            {
              order: 4,
              text: 'Why do you think he/she said it?',
              type: QuestionType.OPEN_ENDED,
              correctAnswer: null
            },
            {
              order: 5,
              text:
                  'When Eleanor got on the bus, did Paul know how long she had been waiting?',
              type: QuestionType.BOOLEAN,
              correctAnswer: 'No'
            },
            {
              order: 6,
              text: 'How do you think Eleanor felt? (Select all that apply)',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: [
                'Happy',       'Excited',      'Surprised',     'Embarrassed',
                'Confused',    'Annoyed',      'Hopeful',       'Sad',
                'Angry',       'Feared',       'Frustrated',    'Guilty',
                'Tired',       'Lonely',       'Relieved',      'Relaxed',
                'Indifferent', 'Disappointed', 'Uncomfortable', 'Hurt'
              ],
              correctAnswer: JSON.stringify([
                'Tired', 'Relieved', 'Grateful', 'Happy', 'Annoyed', 'Sad',
                'Angry', 'Frustrated', 'Relaxed', 'Uncomfortable'
              ])
            },  // Example (Grateful not a choice, pick closest)
            {
              order: 7,
              text:
                  'In the story, why was Eleanor waiting at the bus stop for 20 minutes?',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: [
                'She was late', 'She was shopping', 'The bus was late',
                'She missed the bus', 'The bus broke down'
              ],
              correctAnswer: 'The bus was late',
              isControl: true
            },
            {
              order: 8,
              text:
                  'Were there any seats available on the bus when she got on?',
              type: QuestionType.BOOLEAN,
              correctAnswer: 'No',
              isControl: true
            },  // Choices could be Yes/No here
          ],
        },
        // --- Story 19 (Control) ---
        {
          storyNumber: 19,
          storyType: StoryType.CONTROL,
          storyText:
              'Richard bought a new car, a red Peugeot. A few weeks after he bought it, he backed it into his neighbour Ted’s car, an old beat-up Volvo.  His new car wasn’t damaged at all and he didn’t do much damage to Ted’s car either -- just a scratch in the paint above the wheel. Still, he went up and knocked on the door. When Ted answered, Richard said, "I’m really sorry. I’ve just put a small scratch on your car.”  Ted came out and looked at it and said, "Don’t worry. It was only an accident." ',
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
              choices: ['Richard', 'Ted', 'Nobody'],
              correctAnswer: 'Nobody'
            },
            {
              order: 3,
              text: 'Why shouldn’t he/she have said it or why was it awkward?',
              type: QuestionType.OPEN_ENDED,
              correctAnswer: null
            },
            {
              order: 4,
              text: 'Why do you think he/she said it?',
              type: QuestionType.OPEN_ENDED,
              correctAnswer: null
            },
            {
              order: 5,
              text:
                  'Did Richard know what his neighbor Ted’s reaction would be?',
              type: QuestionType.BOOLEAN,
              correctAnswer: 'No'
            },
            {
              order: 6,
              text: 'How do you think Ted felt? (Select all that apply)',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: [
                'Happy',       'Excited',      'Surprised',     'Embarrassed',
                'Confused',    'Annoyed',      'Hopeful',       'Sad',
                'Angry',       'Feared',       'Frustrated',    'Guilty',
                'Tired',       'Lonely',       'Relieved',      'Relaxed',
                'Indifferent', 'Disappointed', 'Uncomfortable', 'Hurt'
              ],
              correctAnswer: JSON.stringify([
                'Relaxed', 'Indifferent', 'Sad', 'Surprised', 'Annoyed',
                'Angry', 'Frustrated', 'Tired', 'Disappointed'
              ])
            },  // Example
            {
              order: 7,
              text: 'In the story, what did Richard do to Ted’s car?',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: [
                'Broke it', 'Broke the window', 'Broke the headlights',
                'Nothing', 'Scratched it', 'Dented it'
              ],
              correctAnswer: 'Scratched it',
              isControl: true
            },
            {
              order: 8,
              text: 'How did Ted react?',
              type: QuestionType.MULTIPLE_CHOICE,
              choices: [
                'He was angry', 'He was indifferent', 'He forgave Richard',
                'He didn’t care'
              ],
              correctAnswer: JSON.stringify([
                'He was indifferent', 'He forgave Richard', 'He didn’t care'
              ]),
              isControl: true
            },  // Or similar forgiving option
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