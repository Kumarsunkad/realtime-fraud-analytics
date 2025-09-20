# backend/model/infer.py
import random, time

def score_transaction(features):
    """
    Dev stub: returns a pseudo score and simple model info.
    Replace this with actual model loading & scoring when ML is ready.
    """
    # simple heuristic: larger Amount slightly more suspicious
    amount = 0.0
    try:
        amount = float(features.get("Amount", 0))
    except:
        amount = 0.0
    base_prob = random.random() * 0.3
    if amount > 200:
        base_prob += 0.25
    if amount > 1000:
        base_prob += 0.2
    iso_outlier = 1 if random.random() > 0.97 else 0
    combined = 0.7 * min(base_prob, 1.0) + 0.3 * iso_outlier
    return {
        "probability": round(min(base_prob, 1.0), 4),
        "iso_outlier": iso_outlier,
        "combined_score": round(float(combined), 4),
        "debug": {"amount": amount}
    }
