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

@app.route("/predict", methods=["POST"])
def predict():
    start = now_ms()
    data = request.json
    if not data or "features" not in data:
        return jsonify({"error":"invalid payload, include features"}), 400
    txn_id = data.get("txn_id", f"txn_{int(time.time()*1000)}")
    features = data["features"]
    try:
        out = score_transaction(features)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    score = float(out.get("combined_score", out.get("probability", 0)))
    if score >= 0.7:
        decision = "REJECT"
        KPI["rejected"] += 1
    elif score >= 0.4:
        decision = "REVIEW"
    else:
        decision = "APPROVE"
        KPI["approved"] += 1

    latency = now_ms() - start
    KPI["total"] += 1
    KPI["latencies"].append(latency)
    KPI["recent"].insert(0, {"txn_id": txn_id, "score": score, "decision": decision, "latency_ms": latency})
    if len(KPI["recent"]) > 200: KPI["recent"].pop()

    # persist
    rec = Transaction(txn_id=txn_id, payload=json.dumps(data), features=json.dumps(features),
                      score=score, decision=decision, model_msgs=json.dumps(out))
    DB.add(rec)
    DB.commit()

    # push to dashboard
    socketio.emit('event', {
        "txn_id": txn_id,
        "score": score,
        "decision": decision,
        "latency_ms": latency,
        "models": out
    }, namespace='/events')

    resp = {"txn_id": txn_id, "score": score, "decision": decision, "models": out}
    if "label" in data: resp["label"] = data["label"]
    return jsonify(resp), 200

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
