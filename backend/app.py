# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
import os, json, time
from db import get_session, Transaction
from model.infer import score_transaction
from utils import now_ms

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret')
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')


DB = get_session()

# in-memory KPI aggregator
KPI = {"total":0, "approved":0, "rejected":0, "latencies":[], "recent":[]}

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status":"ok"}), 200

# ---- Replace or update your predict endpoint with this code ----
from flask import request, jsonify
from model.infer import score_transaction  # existing file we created
import time

# TUNABLE thresholds (change these quickly to demo different behavior)
THRESHOLD_REJECT = 0.6   # combined_score >= this -> REJECT
THRESHOLD_REVIEW  = 0.35 # combined_score in [REVIEW,REJECT) -> REVIEW

def rule_checks(features):
    """
    Simple human-coded rules. Return (rule_detected_bool, reason_str)
    Extend with more rules as needed.
    """
    amt = float(features.get("Amount", 0) or 0)
    v2 = float(features.get("V2", 0) or 0) if "V2" in features else None

    # Rule: very high amount -> immediate REJECT
    if amt >= 10000:
        return True, "RULE_HIGH_AMOUNT>=10000"

    # Rule: negative V2 extreme -> REVIEW
    if v2 is not None and v2 <= -1.5:
        return True, "RULE_V2_EXTREME"

    return False, ""


@app.route("/predict", methods=["POST"])
def predict():
    """
    Unified prediction flow: 
      - validate input
      - apply rules (fast)
      - call model.infer.score_transaction
      - combine results (quorum + thresholds)
      - persist + emit socket event + return JSON
    """
    req = request.get_json(force=True)
    txn_id = req.get("txn_id") or f"tx-{int(time.time()*1000)}"
    features = req.get("features") or {}
    incoming_label = req.get("label", None)  # optional ground truth

    started = time.time()

    # 1) run rule engine
    rule_flag, rule_reason = rule_checks(features)
    rule_msg = {"rule_flag": int(rule_flag), "rule_reason": rule_reason}

    # 2) run ML models (supervised + iso)
    try:
        model_out = score_transaction(features)
    except Exception as e:
        # safe fallback: return APPROVE if models missing but still log
        model_out = {"probability": 0.0, "iso_outlier": 0, "iso_score_raw": 0.0, "combined_score": 0.0}
        model_out["error"] = str(e)

    # 3) combine decisions (quorum + thresholds)
    combined_score = float(model_out.get("combined_score", 0.0))
    # Start assumption: APPROVE
    final_decision = "APPROVE"
    decision_reasons = []

    # If rule detected a hard REJECT -> immediate REJECT (highest priority)
    if rule_flag and rule_reason.startswith("RULE_HIGH_AMOUNT"):
        final_decision = "REJECT"
        decision_reasons.append("rule:HIGH_AMOUNT")
    else:
        # Quorum logic: count votes (rule vote as REVIEW if rule flagged but not high amount)
        votes = {"approve": 0, "review": 0, "reject": 0}

        # Supervised model vote (probability-based)
        prob = float(model_out.get("probability", 0.0))
        if combined_score >= THRESHOLD_REJECT:
            votes["reject"] += 1
            decision_reasons.append("model:REJECT")
        elif combined_score >= THRESHOLD_REVIEW:
            votes["review"] += 1
            decision_reasons.append("model:REVIEW")
        else:
            votes["approve"] += 1
            decision_reasons.append("model:APPROVE")

        # Isolation forest (unsupervised) vote
        iso_flag = int(model_out.get("iso_outlier", 0))
        if iso_flag == 1:
            votes["review"] += 1
            decision_reasons.append("iso:OUTLIER")

        # Rule vote (non-high-amount rules)
        if rule_flag and not rule_reason.startswith("RULE_HIGH_AMOUNT"):
            votes["review"] += 1
            decision_reasons.append(f"rule:{rule_reason}")

        # Now pick final based on votes (simple majority, with tie->REVIEW)
        if votes["reject"] > max(votes["approve"], votes["review"]):
            final_decision = "REJECT"
        elif votes["review"] > max(votes["approve"], votes["reject"]):
            final_decision = "REVIEW"
        elif votes["approve"] >= max(votes["review"], votes["reject"]):
            final_decision = "APPROVE"
        else:
            final_decision = "REVIEW"

    latency_ms = int((time.time() - started) * 1000)

    # Build model_msgs for explainability and audit
    model_msgs = {
        "model": model_out,
        "rule": rule_msg,
        "votes": decision_reasons,
        "thresholds": { "reject": THRESHOLD_REJECT, "review": THRESHOLD_REVIEW }
    }

    # Persist and emit (assuming you have get_session/Transaction etc from your db module)
    try:
        # your existing persistence logic; below are typical calls from earlier app
        from db import get_session, Transaction
        session = get_session()
        tx = Transaction(txn_id=txn_id, payload=req, decision=final_decision, score=combined_score, created_at=None)
        session.add(tx)
        session.commit()
    except Exception as e:
        # don't crash — log and continue
        print("DB persist error:", e)

    # emit via socketio if configured
    try:
        # your socketio instance name may vary; adjust if needed
        socketio.emit("event", {
            "txn_id": txn_id,
            "score": combined_score,
            "decision": final_decision,
            "model_msgs": model_msgs,
            "features": features,
            "latency_ms": latency_ms
        })
    except Exception:
        pass

    # Build response
    response = {
        "txn_id": txn_id,
        "decision": final_decision,
        "score": combined_score,
        "model_msgs": model_msgs,
        "latency_ms": latency_ms
    }
    return jsonify(response)
# ---- end predict handler replacement ----


@app.route("/metrics", methods=["GET"])
def metrics():
    total = KPI["total"]
    avg_latency = sum(KPI["latencies"]) / len(KPI["latencies"]) if KPI["latencies"] else 0
    return jsonify({
        "total": total,
        "approved": KPI["approved"],
        "rejected": KPI["rejected"],
        "avg_latency_ms": avg_latency,
        "recent": KPI["recent"][:20]
    })


# Globals to hold thresholds
THRESHOLD_REVIEW = 0.7
THRESHOLD_REJECT = 0.9

@app.route('/config', methods=['GET', 'POST'])
def config():
    global THRESHOLD_REVIEW, THRESHOLD_REJECT
    if request.method == 'POST':
        data = request.json
        if 'review' in data:
            THRESHOLD_REVIEW = float(data['review'])
        if 'reject' in data:
            THRESHOLD_REJECT = float(data['reject'])
        return jsonify({
            "message": "Thresholds updated",
            "review": THRESHOLD_REVIEW,
            "reject": THRESHOLD_REJECT
        })
    else:
        return jsonify({
            "review": THRESHOLD_REVIEW,
            "reject": THRESHOLD_REJECT
        })

@app.route("/recent", methods=["GET"])
def recent():
    rows = DB.query(Transaction).order_by(Transaction.created_at.desc()).limit(100).all()
    out = []
    for r in rows:
        try:
            feats = json.loads(r.features)
        except:
            feats = {}
        try:
            model_msgs = json.loads(r.model_msgs) if r.model_msgs else {}
        except:
            model_msgs = {}
        out.append({
            "txn_id": r.txn_id,
            "score": r.score,
            "decision": r.decision,
            "created_at": str(r.created_at),
            "features": feats,
            "model_msgs": model_msgs
        })
    return jsonify(out)

@socketio.on('connect', namespace='/events')
def on_connect():
    print("Client connected")

@socketio.on('disconnect', namespace='/events')
def on_disconnect():
    print("Client disconnected")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port)
