# backend/model/infer.py
import os, json, joblib, numpy as np

BASE = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE, "model.pkl")
SCALER_PATH = os.path.join(BASE, "scaler.pkl")
COLUMNS_PATH = os.path.join(BASE, "columns.json")

_models = None
_scaler = None
_columns = None

def _load_artifacts():
    global _models, _scaler, _columns
    if _models is None:
        if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH) or not os.path.exists(COLUMNS_PATH):
            raise RuntimeError("Missing artifacts. Ensure model.pkl, scaler.pkl and columns.json exist in model/.")
        _models = joblib.load(MODEL_PATH)
        _scaler = joblib.load(SCALER_PATH)
        with open(COLUMNS_PATH, "r") as f:
            _columns = json.load(f)

def _build_row_from_features(features: dict):
    """
    Build a 1 x N numpy array consistent with the column order saved in columns.json.
    If a feature is missing, we use 0.0 as a safe default.
    """
    row = []
    for col in _columns:
        # use string keys flexibly (keys in features may be strings)
        val = features.get(col)
        if val is None:
            # also try to find by case-insensitive match
            for k in features.keys():
                if str(k).lower() == str(col).lower():
                    val = features[k]
                    break
        try:
            row.append(float(val))
        except:
            row.append(0.0)
    arr = np.array(row).reshape(1, -1)
    return arr

def score_transaction(features: dict):
    """
    features: dict mapping feature name -> value
    returns: dict with probability, iso_outlier, iso_score_raw, combined_score
    """
    _load_artifacts()
    X_row = _build_row_from_features(features)
    Xs = _scaler.transform(X_row)
    clf = _models.get("clf") if isinstance(_models, dict) else _models['clf']
    iso = _models.get("iso") if isinstance(_models, dict) else _models['iso']
    prob = float(clf.predict_proba(Xs)[:,1][0])
    iso_score_raw = float(iso.decision_function(Xs)[0])  # higher => more normal
    iso_outlier = int(iso.predict(Xs)[0] == -1)
    combined = 0.7 * prob + 0.3 * iso_outlier
    return {
        "probability": round(prob, 6),
        "iso_outlier": int(iso_outlier),
        "iso_score_raw": round(iso_score_raw, 6),
        "combined_score": round(float(combined), 6),
        "features_used": _columns
    }
