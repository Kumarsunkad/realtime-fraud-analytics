# backend/model/train_model.py
import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, roc_auc_score
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "scaler.pkl")

def load_csv(path):
    df = pd.read_csv(path)
    return df

def build_and_train(csv_path, test_size=0.2):
    print("Loading:", csv_path)
    df = load_csv(csv_path)
    if 'Class' not in df.columns:
        raise RuntimeError("Expected 'Class' column in dataset.")
    y = df['Class'].values
    X = df.drop(columns=['Class'])
    # fillna guard
    X = X.fillna(0)
    scaler = StandardScaler()
    Xs = scaler.fit_transform(X)
    X_train, X_test, y_train, y_test = train_test_split(Xs, y, test_size=test_size, random_state=42, stratify=y)
    # Supervised model
    clf = RandomForestClassifier(n_estimators=200, class_weight='balanced', random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)
    probs = clf.predict_proba(X_test)[:,1]
    auc = roc_auc_score(y_test, probs)
    print("RandomForest AUC:", auc)
    print(classification_report(y_test, clf.predict(X_test)))
    # Unsupervised trained on normal data
    iso = IsolationForest(contamination=max(0.001, y.mean()), random_state=42)
    iso.fit(X_train[y_train == 0])
    # Save
    joblib.dump({"clf": clf, "iso": iso}, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    print("Saved model to:", MODEL_PATH)
    print("Saved scaler to:", SCALER_PATH)
    return MODEL_PATH, SCALER_PATH

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python train_model.py path/to/creditcard.csv")
        sys.exit(1)
    build_and_train(sys.argv[1])
