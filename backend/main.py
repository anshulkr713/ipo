from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from textblob import TextBlob
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI(title="IPO Dashboard API")

# Enable CORS so frontend (localhost:4322) can call this backend (localhost:8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ListingPredictRequest(BaseModel):
    gmp_percent: float
    subscription_total: float
    category: str  # Mainboard or SME

class SentimentRequest(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"message": "IPO Dashboard Intelligence API is live! 🚀"}

@app.post("/predict-listing")
def predict_listing_gain(data: ListingPredictRequest):
    """
    Predicts listing probability and estimated gain based on GMP and Subscription.
    This is a heuristic model for demonstration.
    """
    
    # Base probability from GMP (GMP represents market sentiment)
    # If GMP is 50%, that's strong. If 0%, weak.
    # We cap GMP contribution at 70% probability
    gmp_score = min(data.gmp_percent, 100) * 0.7
    
    # Subscription contribution (High sub = higher certainty)
    # We cap sub contribution at 20%
    sub_score = min(data.subscription_total, 100) * 0.2
    
    # Adjustment for Category
    # SME IPOs are more volatile, so we add variance
    variance = 0
    if data.category == "SME":
        variance = random.uniform(-5, 10) # SME wild card
    
    probability = min(max(gmp_score + sub_score + variance + 10, 0), 99)
    
    sentiment = "Neutral"
    if probability > 75:
        sentiment = "High Strong"
    elif probability > 50:
        sentiment = "Positive"
    elif probability > 30:
        sentiment = "Cautious"
    else:
        sentiment = "Avoid"

    return {
        "probability_percent": round(probability, 1),
        "sentiment": sentiment,
        "estimated_gain_min": data.gmp_percent * 0.9,
        "estimated_gain_max": data.gmp_percent * 1.15,
        "analysis": f"Based on {data.gmp_percent}% GMP and {data.subscription_total}x subscription."
    }

@app.post("/analyze-sentiment")
def analyze_sentiment(data: SentimentRequest):
    """
    Analyzes text sentiment using TextBlob (NLP).
    Returns Polarity (-1 to 1) and Subjectivity (0 to 1).
    """
    blob = TextBlob(data.text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity
    
    status = "Neutral"
    if polarity > 0.1:
        status = "Positive"
    elif polarity < -0.1:
        status = "Negative"
        
    return {
        "text_snippet": data.text[:50] + "...",
        "polarity": round(polarity, 2),
        "subjectivity": round(subjectivity, 2),
        "status": status,
        "confidence": round((abs(polarity) + (1 - subjectivity)) / 2 * 100, 1)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
