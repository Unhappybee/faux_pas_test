import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getQuestionGroups, checkUserProgress } from "../utils/Api";

const GroupSelection: React.FC = () => {
  const [groups, setGroups] = useState<{ id: number; name: string }[]>([]);
  const [completedGroups, setCompletedGroups] = useState<number[]>([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const userId = searchParams.get("userId");

  useEffect(() => {
    const fetchGroupsAndProgress = async () => {
      try {
        const groupResponse = await getQuestionGroups(); // Fetch available groups
        setGroups(groupResponse);

        // Check user progress to know which groups have been completed
        const progressResponse = await checkUserProgress(userId);
        setCompletedGroups(progressResponse.completedGroups);
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };

    if (userId) {
      fetchGroupsAndProgress();
    }
  }, [userId]);

  const handleGroupSelection = (groupId: number) => {
    navigate(`/questionnaire?userId=${userId}&groupId=${groupId}`);
  };

  const handleBackToRegistration = () => {
    navigate("/register");
  };

  const handleCompletionRedirect = () => {
    navigate("/register");
  };

  if (!userId) {
    return <p className="error-message">Error: No user ID found. Please restart.</p>;
  }

  // Determine the available groups based on completed tests
  let availableGroups: { id: number; name: string }[] = [];

  const FIRST_TEST_ID = 3; 

  if (completedGroups.length === 0) {
    // Show only the first test
    availableGroups = groups.filter((group) => group.id === FIRST_TEST_ID);
  } else if (completedGroups.includes(FIRST_TEST_ID)) {
    // Show remaining groups that are NOT the first one
    availableGroups = groups.filter(
      (group) => group.id !== FIRST_TEST_ID && !completedGroups.includes(group.id)
    );
  } else if (completedGroups.length === 3) {
    setTimeout(handleCompletionRedirect, 1000);
    return <p className="message">Both tests completed. Redirecting to registration...</p>;
  }


  return (
    <div className="container-selection">
      <h2 className="title">Select a Test</h2>
      {completedGroups.length == 0 && (
          <p className="description">
          Thank you for taking the time to participate in this questionnaire!    
        </p>
      )}

      {completedGroups.length == 1 && (
          <p className="description">
          Thank you for taking the time to complete the questionnaire!!!! If you want you may complete remaining questionnaires as well
        </p>
      )}

      <div className="button-container">
        {availableGroups.length > 0 ? (
          availableGroups.map((group) => (
            <button
              key={group.id}
              className="group-button"
              onClick={() => handleGroupSelection(group.id)}
            >
              {group.name}
            </button>
          ))
        ) : (
          <p className="message">Loading groups...</p>
        )}
      </div>

      {/* Option to go back to registration if one test is completed */}
      {completedGroups.length === 1 && (
        
        <button className="back-button" onClick={handleBackToRegistration}>
          Go Back to Registration
        </button>
      )}
    </div>
  );
};

export default GroupSelection;
