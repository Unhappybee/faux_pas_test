// src/types/Evaluation.ts

export interface FinalScores {
  userId: number;

  // Control Question Scores
  correctControlQsFp:
      number;  // Sum of correct control Qs (7&8) for valid FP stories
  correctControlQsControl:
      number;  // Sum of correct control Qs (7&8) for valid Control stories
  maxControlQsFp:
      number;  // Max possible control Q score for FP stories answered
  maxControlQsControl:
      number;  // Max possible control Q score for Control stories answered

  // Story Validity Counts
  validStoriesCount: number;  // Number of stories used in ratio calculations
  invalidStoriesCount:
      number;  // Number of stories excluded due to control errors

  // Calculated Ratios (Normalized by sum of correctControlQsFp +
  // correctControlQsControl) Value is null if the denominator is 0
  fauxPasDetectionRatio: number|null;
  understandingInappropriatenessRatio: number|null;
  intentionsRatio: number|null;
  beliefRatio: number|null;
  empathyRatio: number|null;
}
