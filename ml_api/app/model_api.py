import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch.nn.functional as F
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn # For running the server

MODEL_DIRECTORY = r"./final_trained_model_with_validation" 
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MAX_LEN = 256 # Use the same MAX_LEN as training

print(f"--- Model API Server ---")
print(f"Using device: {DEVICE}")

tokenizer = None
model = None
sep_token = None

try:
    if not os.path.isdir(MODEL_DIRECTORY):
        raise OSError(f"Model directory not found: {MODEL_DIRECTORY}")

    print(f"Loading tokenizer from: {MODEL_DIRECTORY}")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIRECTORY)
    sep_token = tokenizer.sep_token

    print(f"Loading model from: {MODEL_DIRECTORY}")
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIRECTORY)
    model.to(DEVICE)
    model.eval() 
    print("--- Model and tokenizer loaded successfully. Ready for requests. ---")

except Exception as e:
    print(f"FATAL ERROR: Could not load model or tokenizer. API cannot start.")
    print(e)
    tokenizer = None
    model = None

class EvaluationRequest(BaseModel):
    story: str
    question: str
    answer: str

class EvaluationResponse(BaseModel):
    score: int # 0 or 1
    probability: float 

app = FastAPI()

@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_endpoint(request: EvaluationRequest):
    """
    Accepts story, question, answer and returns the ML model's evaluation score.
    """
    if model is None or tokenizer is None:
         raise HTTPException(status_code=503, detail="Model not loaded. API is not available.")

    try:
       
        text = f"{request.story} {sep_token} {request.question} {sep_token} {request.answer}"
        text = text.lower().strip()

        inputs = tokenizer(text,
                           return_tensors='pt',
                           truncation=True,
                           padding='max_length',
                           max_length=MAX_LEN)
        inputs = {key: value.to(DEVICE) for key, value in inputs.items()}

        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits

        probabilities = F.softmax(logits, dim=-1)
        predicted_class_id = torch.argmax(logits, dim=-1).item()
        predicted_prob = probabilities[0, predicted_class_id].item()

        print(f"Evaluated input. Predicted Class: {predicted_class_id}, Prob: {predicted_prob:.4f}") # Server-side logging

        return EvaluationResponse(score=predicted_class_id, probability=predicted_prob)

    except Exception as e:
        print(f"Error during prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error during evaluation: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "ok" if model and tokenizer else "error", "model_loaded": bool(model and tokenizer)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)