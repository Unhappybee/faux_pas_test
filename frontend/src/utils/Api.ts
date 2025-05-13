import axios from 'axios';

import {FinalScores} from '../types/Evaluation';
import {Question} from '../types/Questionnaire';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Creates a new user by sending a POST request to the backend.
 * @param username The username of the user to create.
 * @returns The data of the created user from the backend response.
 */
export const createUser = async (username: string) => {
  const response = await axios.post(`${API_URL}/users`, {username});
  return response.data;
};


/**
 * Fetches questions for a specific group ID.
 * @param groupId The ID of the question group to fetch questions for.
 * @returns A Promise that resolves to an array of Question objects.
 */
export const fetchQuestions = async(groupId: number): Promise<Question[]> => {
  try {
    const response = await axios.get(`${API_URL}/questions/group/${groupId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching questions', error);
    throw error;
  }
};

/**
 * Submits answers for a specific user.
 * @param userId The ID of the user to submit answers for.
 * @param responses An object mapping question IDs to their respective answers.
 * @returns A Promise that resolves when the submission is complete.
 */
export const submitAnswers =
    async (userId: number, responses: {[key: number]: string|string[]}) => {
  const answers = Object.entries(responses).map(([questionId, answer]) => {
    let textToSend: string;  // Ensure we always produce a string

    if (typeof answer === 'string') {
      textToSend = answer;
    } else if (Array.isArray(answer)) {
      textToSend = answer.join('; ');  // Join array or empty string
    } else {
      textToSend = '';  // Default null/undefined to empty string
    }

    return {
      userId,
      questionId: Number(questionId),
      answerText: textToSend,  // Always a string
    };
  });

  try {
    const submissionPromises = answers.map(
        (answer) => axios.post(
            `${API_URL}/answers`, answer)  // Sends the same payload structure
    );
    await Promise.all(submissionPromises);
    console.log(`Raw answers submitted for user ${userId}`);

  } catch (error) {
    console.error('Failed to submit answers', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error response:', error.response.data);
    }
    throw new Error('Failed to submit question groups');
  }
};

/**
 * Is not used in the frontend, but can be used to fetch all questions.
 * Fetches the question groups from the backend.
 * @returns A Promise that resolves to an array of question groups.
 */
export const getQuestionGroups = async () => {
  const response = await fetch(`${API_URL}/groups`);
  if (!response.ok) {
    throw new Error('Failed to fetch question groups');
  }
  return response.json();
};


/**
 * Fetches the final scores for a specific user.
 * @param userId The ID of the user to fetch scores for.
 * @returns A Promise that resolves to the FinalScores object.
 */
export const calculateAndFetchScores =
    async(userId: number): Promise<FinalScores> => {
  try {
    console.log(`API: Requesting score calculation for user ${userId}`);
    const response = await axios.post<FinalScores>(
        `${API_URL}/users/${userId}/calculate-scores`);
    console.log(`API: Received scores for user ${userId}`, response.data);
    return response.data;  // The backend returns the FinalScores object
  } catch (error) {
    console.error(`API: Error fetching scores for user ${userId}`, error);
    // Extract more specific error message if possible
    const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error ?
        error.response.data.error :
        'Failed to calculate or fetch scores.';
    throw new Error(errorMessage);
  }
};
