// src/components/ResultsPage.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FinalScores } from '../types/Evaluation';
import { calculateAndFetchScores } from '../utils/Api';
import './ResultsPage.css'; // Import the CSS


interface ScoreBarProps {
    value: number | null | undefined;
    max?: number; 
    label: string;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ value, max = 1.0, label }) => {
    const scoreValue = typeof value === 'number' ? value : 0; // Treat null/undefined as 0 for bar display
    const percentage = max > 0 ? (scoreValue / max) * 100 : 0;
    const displayValue = typeof value === 'number' ? value.toFixed(2) : 'N/A';

    return (
        <div className="score-display">
            <strong>{label}:</strong> {displayValue} {max !== 1.0 ? ` / ${max}` : ''}
            <div className="score-bar-container" title={`${label}: ${displayValue}`}>
                <div
                    className="score-bar" 
                    style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}  
                    aria-valuenow={scoreValue}
                    aria-valuemin={0}
                    aria-valuemax={max}
                    role="progressbar"
                >
                </div>
            </div>
        </div>
    );
};


const ResultsPage: React.FC = () => {

    const location = useLocation() as { state: { userId: number } | null };
     const userId = location.state?.userId;

    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [scores, setScores] = useState<FinalScores | null>(null);

    useEffect(() => {
        if (!userId || isNaN(userId)) {
            setError("Invalid User ID provided.");
            setLoading(false);
            return;
        }

        const fetchScores = async () => {
            setLoading(true);
            setError(null);
            try {
                const fetchedScores = await calculateAndFetchScores(userId);
                setScores(fetchedScores);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load results.");
                console.error("Fetching scores failed:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchScores();
    }, [userId]);

    if (loading) {
        return <div className="results-container"><h2>Loading Results...</h2><p>Please wait while we calculate your scores.</p></div>;
    }

    if (error) {
        return <div className="results-container error-container"><h2>Error Loading Results</h2><p>{error}</p><button onClick={() => navigate(`/select-group?userId=${userId}`)}>Go Back</button></div>;
    }

    if (!scores) {
       return <div className="results-container"><h2>No Results Found</h2><p>Could not retrieve scores for this user.</p></div>;
   }

    const getInterpretationNotes = (scoresData: FinalScores): string[] => {
         const notes: string[] = [];
         const cutoff1_5SD = { detection: 0.825, understanding: 0.835, intentions: 0.80, belief: 0.765, empathy: 0.835 };

         let lowScoreCount = 0;
         if (scoresData.fauxPasDetectionRatio !== null && scoresData.fauxPasDetectionRatio < cutoff1_5SD.detection) lowScoreCount++;
         if (scoresData.understandingInappropriatenessRatio !== null && scoresData.understandingInappropriatenessRatio < cutoff1_5SD.understanding) lowScoreCount++;
         if (scoresData.intentionsRatio !== null && scoresData.intentionsRatio < cutoff1_5SD.intentions) lowScoreCount++;
         if (scoresData.beliefRatio !== null && scoresData.beliefRatio < cutoff1_5SD.belief) lowScoreCount++;
         if (scoresData.empathyRatio !== null && scoresData.empathyRatio < cutoff1_5SD.empathy) lowScoreCount++;

         notes.push("These scores reflect performance on tasks related to understanding social situations, compared to a reference group.");

         if (scoresData.invalidStoriesCount > 0) {
              notes.push(`Important: ${scoresData.invalidStoriesCount} story/stories were excluded because the basic details weren't fully recalled. This can affect the social understanding scores.`);
         }

         if (lowScoreCount >= 2) { 
             notes.push("Performance in some areas of social understanding (like detecting awkward moments or understanding intentions/feelings) was lower than typically observed.");
             notes.push("Sometimes, challenges in these areas can make social interactions feel more complex.");
             notes.push("If you have concerns about understanding social cues or navigating social situations, discussing these observations with a healthcare professional (like a doctor or psychologist) could provide further clarity.");
         } else if (lowScoreCount === 1) {
             notes.push("Performance was slightly lower than typically observed in one specific area of social understanding. This may or may not be noticeable in daily interactions.");
         } else {
              notes.push("Overall performance on tasks related to understanding social situations was within the range typically observed in our reference group.");
         }
        return notes;
    };

    const interpretationNotes = getInterpretationNotes(scores);

    return (
        <div className="results-container">
            <h2>Test Results Summary</h2>
            <p style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9em' }}>User ID: {scores.userId}</p>

            {/* Section 1: Comprehension Check */}
            <div className="results-section">
                <h3>Story Comprehension Check</h3>
                <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '1rem' }}>
                    This checks if the basic details of the stories were understood correctly.
                    Good comprehension is needed to reliably assess social understanding.
                </p>
                <ScoreBar
                    label="Faux Pas Stories Comprehension"
                    value={scores.correctControlQsFp}
                    max={scores.maxControlQsFp}
                />
                <ScoreBar
                    label="Control Stories Comprehension"
                    value={scores.correctControlQsControl}
                    max={scores.maxControlQsControl}
                />
                {scores.invalidStoriesCount > 0 && (
                    <p className="excluded-note">
                        Note: Because comprehension questions were missed for {scores.invalidStoriesCount} story/stories,
                        those stories were not included in the 'Social Understanding' scores below.
                    </p>
                )}
            </div>

            {/* Section 2: Social Understanding Performance */}
            <div className="results-section">
                <h3>Social Understanding Performance</h3>
                 <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '1rem' }}>
                    These scores show performance on different aspects of understanding social situations,
                    like recognizing awkward moments or figuring out people's thoughts and feelings.
                    Scores are shown relative to a maximum possible score of 1.0.
                </p>
                <ScoreBar label="Detecting the Issue (Faux Pas Detection)" value={scores.fauxPasDetectionRatio} />
                <ScoreBar label="Understanding Why it was Awkward" value={scores.understandingInappropriatenessRatio} />
                <ScoreBar label="Understanding Intentions" value={scores.intentionsRatio} />
                <ScoreBar label="Understanding Beliefs/Knowledge" value={scores.beliefRatio} />
                <ScoreBar label="Understanding Feelings (Empathy)" value={scores.empathyRatio} />
            </div>

            {/* Section 3: Interpretation Notes */}
            <div className="interpretation-notes">
                <h4>Notes on Interpretation</h4>
                {interpretationNotes.map((note, index) => (
                    <p key={index}>{note}</p>
                ))}
                 <p className="disclaimer">
                     <strong>Disclaimer:</strong> This is a screening tool, not a diagnostic assessment.
                     These results provide insights into specific cognitive skills but should be interpreted
                     cautiously and ideally discussed with a qualified professional if you have any concerns
                     about social functioning or cognitive abilities.
                 </p>
            </div>

            {/* Finish Button */}
            <button className="finish-button" onClick={() => navigate(`/register`, { replace: true })}>
                Finish 
            </button>
        </div>
    );
};

export default ResultsPage;