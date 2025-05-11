export interface Story {
  id: number;
  storyText: string;
}

// Question type that represents the structure of the question object
export interface Question {
  id: number;
  questionText: string;  // The text of the question
  questionType: 'BOOLEAN'|'MULTIPLE_CHOICE'|'OPEN_ENDED';  // Type of question
  groupId: number;    // ID of the group the question belongs to
  choices: string[];  // Available choices for MULTIPLE_CHOICE type questions
  flowYes?: number|null;  // ID of the next question if the answer is "Yes"
  flowNo?: number|null;   // ID of the next question if the answer is "No"
  parentQuestionId?: number|
      null;  // Optional parent question ID (if it's a follow-up question)
  story?: Story|null;        // Optional related story for the question
  evaluation?: number|null;  // Optional evaluation for the question
  exampleAnswer?: string;
  createdAt: string;  // Date when the question was created
  updatedAt: string;  // Date when the question was last updated
}

export interface QuestionnaireData {
  [key: number]: string;
}
