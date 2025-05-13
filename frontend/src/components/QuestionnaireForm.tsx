import { useState, useEffect, useRef } from "react";
import { fetchQuestions, submitAnswers } from "../utils/Api";
import { useNavigate, useLocation } from "react-router-dom";
import { Question } from "../types/Questionnaire";
import "./QuestionnaireForm.css"; 


const QuestionnaireForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<{ [key: number]: string | string[] }>({});
  const [questionHistory, setQuestionHistory] = useState<number[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const userId = Number(new URLSearchParams(location.search).get("userId"));
  const groupId = Number(new URLSearchParams(location.search).get("groupId"));
  const [isNextDisabled, setIsNextDisabled] = useState(true);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);


  useEffect(() => {
    if (!userId) {
      navigate("/register"); // Redirect if no userId
      return;
    }

    const getQuestions = async () => {
      try {
        const fetchedQuestions = await fetchQuestions(groupId);
        setQuestions(fetchedQuestions);
      } catch (error) {
        console.error("Failed to fetch questions", error);
      }
    };

    getQuestions();
  }, [userId, groupId, navigate]);

  useEffect(() => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
  
    const userResponse = responses[currentQuestion.id];
  
    const isValidResponse =
      (currentQuestion.questionType === "OPEN_ENDED" && userResponse && userResponse !== "") ||
      (currentQuestion.questionType === "MULTIPLE_CHOICE" && userResponse) ||
      (currentQuestion.questionType === "BOOLEAN" && userResponse);
  
    setIsNextDisabled(!isValidResponse);
    setIsSubmitDisabled(!isValidResponse);
  }, [questions, responses, currentQuestionIndex]);

  const handleNext = () => {
    const currentQuestion = questions[currentQuestionIndex];

    let nextIndex = -1;
  
    // If it's a BOOLEAN question and the answer is "No", move to flowNo
    if (currentQuestion.questionType === "BOOLEAN" && responses[currentQuestion.id] === "No") {
      const flowNoQuestionId = currentQuestion.flowNo;
      if (flowNoQuestionId) {
        nextIndex = questions.findIndex(q => q.id === flowNoQuestionId);
      }
    } 
  
    // Otherwise, move to flowYes (default behavior), or show submit if no flowYes is available
    if (nextIndex === -1) {
      const flowYesQuestionId = currentQuestion.flowYes;
      if (flowYesQuestionId) {
        nextIndex = questions.findIndex(q => q.id === flowYesQuestionId);
      }
    }
  
    // If a valid next question is found, navigate to it
    if (nextIndex !== -1) {
      setQuestionHistory((prev) => [...prev, currentQuestionIndex]);
      setCurrentQuestionIndex(nextIndex);
    }
  };
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
        const formattedResponses = Object.keys(responses).reduce((acc, questionIdStr) => {
            const questionId = parseInt(questionIdStr, 10);
            let answer = responses[questionId];
            if (Array.isArray(answer)) {
                answer = answer.join('; ');
            }
            acc[questionId] = answer as string; // Now always string or null
            return acc;
        }, {} as { [key: number]: string });


        console.log("Submitting answers...");
        await submitAnswers(userId!, formattedResponses);
        console.log("Answers submitted successfully.");

        navigate('/results', { state: { userId: userId } });

    } catch (err) {
        console.error("Error during submission:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
        setIsSubmitting(false); 
    }
  
};
   
  const handleBack = () => {
    if (questionHistory.length > 0) {
      const lastIndex = questionHistory[questionHistory.length - 1];

      setQuestionHistory((prev) => prev.slice(0, -1));

      setCurrentQuestionIndex(lastIndex);
    }
  };
  
  const handleResponseChange = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement | HTMLInputElement>) => {
    setResponses({ ...responses, [questions[currentQuestionIndex].id]: event.target.value });
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; 
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; 
    }
  };

  const handleYesNoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value; 
    setResponses({
      ...responses,
      [currentQuestion.id]: value, 
    });

  };

  const handleMultipleChoiceChange = (event: React.ChangeEvent<HTMLInputElement>, questionId: number) => {
    const { value, checked } = event.target;
  
    setResponses((prevResponses) => {
      const selectedChoices = prevResponses[questionId] ? [...prevResponses[questionId]] : [];
  
      if (checked) {
        selectedChoices.push(value);
      } else {
        const index = selectedChoices.indexOf(value);
        if (index > -1) {
          selectedChoices.splice(index, 1);
        }
      }
  
      return { ...prevResponses, [questionId]: selectedChoices };
    });
  };
  

  const handleKeyPress = (
    event: React.KeyboardEvent,
    questionId: number
  ) => {
    if (event.key === "Enter") {
      const currentResponse = responses[questionId];
  
      const isValid =
        typeof currentResponse === "string"
          ? currentResponse.trim().length > 0
          : Array.isArray(currentResponse)
          ? currentResponse.length > 0
          : !!currentResponse;
  
      if (isValid) {
        event.preventDefault();
        handleNext();
      }
    }
  };

  if (error) {
    return (
        <div className="container error-container">
            <h2>Error</h2>
            <p>{error}</p>
            {/* Allow retry by resetting error and enabling button */}
            <button onClick={() => { setError(null); setIsSubmitting(false); }} >Try Submit Again</button>
            <button onClick={() => navigate(`/register`)}>Go Back to Groups</button>
        </div>
    );
}
  

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;


  if (questions.length === 0) {
    return <div>Loading questions...</div>;
  }

  if (questions.length === 0 && !userId) { 
    return <div>Loading...</div>; 
}
 if (questions.length === 0 && userId) {
     return <div>Loading questions...</div>;
 }


  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return <div>Loading...</div>; 

  return (
    <div className="container">
      <aside className="sidebar">
        <h2 className="title">Th.o.m.a.s. Questionnaire</h2>
      </aside>
      <main className="content">
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
  
        {currentQuestion.story && (
          <div className="story-container">
            <h3>Story</h3>
            <p>{currentQuestion.story.storyText}</p>
          </div>
        )}
  
        <form>
          <div className="question">
            <label className="question-label">{currentQuestion.questionText}</label>
  
            {/* Display example answer if available */}
            {currentQuestion.exampleAnswer && (
              <div className="example-answer">
                <p><strong>Example Answer:</strong></p>
                <p>{currentQuestion.exampleAnswer}</p>
              </div>
            )}
  
            {/* Render open-ended question */}
            {currentQuestion.questionType === "OPEN_ENDED" && (
              <div>
                <textarea
                  ref={textareaRef}
                  className="question-textarea"
                  value={responses[currentQuestion.id] as string || ""}
                  onChange={handleResponseChange}
                  onKeyPress={(e) => handleKeyPress(e, currentQuestion.id)}
                />
              </div>
            )}
  
            {/* Render boolean question */}
            {currentQuestion.questionType === "BOOLEAN" && (
              <div>
                <label>
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value="Yes"
                    checked={responses[currentQuestion.id] === "Yes"}
                    onChange={handleYesNoChange}
                    onKeyPress={(e) => handleKeyPress(e, currentQuestion.id)}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value="No"
                    checked={responses[currentQuestion.id] === "No"}
                    onChange={handleYesNoChange}
                    onKeyPress={(e) => handleKeyPress(e, currentQuestion.id)}
                  />
                  No
                </label>
              </div>
            )}
  
            {/* Render multiple-choice question */}
            {currentQuestion.questionType === "MULTIPLE_CHOICE" && (
              <div
                className={`choices-grid ${
                  currentQuestion.choices?.length > 6 ? "three-columns" : "one-columns"
                }`}
              >
                {currentQuestion.choices?.map((choice, index) => (
                  <label key={index} className="option-label">
                    <input
                      type="checkbox"
                      value={choice}
                      checked={responses[currentQuestion.id]?.includes(choice) || false}
                      onChange={(e) => handleMultipleChoiceChange(e, currentQuestion.id)}
                      onKeyPress={(e) => handleKeyPress(e, currentQuestion.id)}
                    />
                    {choice}
                  </label>
                ))}
              </div>
            )}
          </div>
  
          {/* Navigation buttons */}
          <div className="navigation-buttons">
            {currentQuestionIndex > 0 && (
              <button type="button" className="nav-button" onClick={handleBack}>
                ⬅ Previous
              </button>
            )}
            {currentQuestionIndex < questions.length - 1 && (
              <button
                type="button"
                className="nav-button"
                onClick={handleNext}
                disabled={isNextDisabled}
              >
                Next ➡
              </button>
            )}
          </div>
  
          {currentQuestion.flowYes === null && !currentQuestion.flowNo && ( // Refined: last if no flow out
                             <button
                                 type="button"
                                 className="submit-button"
                                 onClick={handleSubmit}
                                 disabled={isSubmitDisabled || isSubmitting}
                             >
                                 {isSubmitting ? 'Calculating Scores...' : 'Submit & View Results'}
                             </button>
                         )}
        </form>
      </main>
    </div>
  );
  
};
export default QuestionnaireForm;
