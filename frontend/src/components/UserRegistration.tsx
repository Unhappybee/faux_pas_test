import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser } from "../utils/Api";
import "./UserRegistration.css"; 

const UserRegistration: React.FC = () => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleUserCreation = async () => {
    if (!username.trim()) {
      setError("Please enter your name.");
      return;
    }

    try {
      const response = await createUser(username);
      navigate(`/questionnaire?userId=${response.id}&groupId=1`);
    } catch (err) {
      console.error("Failed to create user", err);
      setError("Something went wrong. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleUserCreation();
    }
  };

  return (
    <div className="user-registration-container">
      <h2 className="title">Welcome! Enter Your Name to Start</h2>
      <input
        type="text"
        placeholder="Enter your name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={handleKeyDown}
        className="input-field"
      />
      <button onClick={handleUserCreation} className="submit-button">
        Next
      </button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default UserRegistration;
