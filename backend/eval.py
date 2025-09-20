# backend/eval.py
import sqlite3, json, sys
from sklearn.metrics import confusion_matrix, accuracy_score, precision_score, recall_score

def load_db(path='fraud.db'):
    conn = sqlite3.connect(path)
    cur = conn.cursor()
    rows = cur.execute("select payload, decision from transactions").fetchall()
    y_true, y_pred = [], []
    for payload_str, decision in rows:
        try:
            p = json.loads(payload_str)
        except:
            continue
        if 'label' in p:
            y_true.append(int(p['label']))
            y_pred.append(1 if decision in ('REJECT','REVIEW') else 0)
    return y_true, y_pred

if __name__=="__main__":
    y_true, y_pred = load_db()
    if not y_true:
        print("No labeled rows found in DB. Make sure simulator sends 'label' in payload.")
        sys.exit(0)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    print("TP:", tp, "FP:", fp, "TN:", tn, "FN:", fn)
    print("Accuracy:", accuracy_score(y_true,y_pred))
    print("Precision:", precision_score(y_true,y_pred, zero_division=0))
    print("Recall:", recall_score(y_true,y_pred, zero_division=0))
