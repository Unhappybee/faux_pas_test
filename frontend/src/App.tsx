import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserRegistration from "./components/UserRegistration";
import GroupSelection from "./components/GroupSelection"; // Import new page
import QuestionnaireForm from "./components/QuestionnaireForm";
import ResultsPage from "./components/ResultsPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UserRegistration />} />
        <Route path="/register" element={<UserRegistration />} />
        <Route path="/select-group" element={<GroupSelection />} /> 
        <Route path="/questionnaire" element={<QuestionnaireForm />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
