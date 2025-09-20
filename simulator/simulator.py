# simulator/simulator.py
# Simple simulator: reads a CSV and posts rows to /predict including label (Class)
# Usage: python simulator.py --csv ../backend/model/train_transactions.csv --rate 50 --total 500

import argparse, csv, time, json, random, requests, sys
from itertools import cycle

def send_row(url, row, txn_idx):
    features = dict(row)
    # remove Class from features and cast numeric strings where possible
    label = features.pop("Class", None)
    # create txn id
    txn_id = f"sim_{txn_idx}_{random.randint(1000,9999)}"
    payload = {"txn_id": txn_id, "features": {}}
    for k,v in features.items():
        # try numeric
        try:
            payload["features"][k] = float(v)
        except:
            payload["features"][k] = v
    if label is not None:
        payload["label"] = int(float(label))
    try:
        r = requests.post(url, json=payload, timeout=5)
        return r.status_code, r.text
    except Exception as e:
        return 0, str(e)

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--csv", required=True)
    p.add_argument("--rate", type=int, default=50, help="requests per second")
    p.add_argument("--total", type=int, default=500, help="total requests to send")
    p.add_argument("--url", default="http://127.0.0.1:5000/predict")
    args = p.parse_args()

    # read csv rows
    rows = []
    with open(args.csv, newline='') as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(r)
    if not rows:
        print("No rows in CSV:", args.csv); sys.exit(1)

    print(f"Loaded {len(rows)} rows, sending {args.total} requests at {args.rate}/s to {args.url}")
    # iterate rows in cycle
    it = cycle(rows)
    sent = 0
    interval = 1.0 / max(1, args.rate)
    start = time.time()
    while sent < args.total:
        row = next(it)
        status, text = send_row(args.url, row, sent+1)
        sent += 1
        if sent % 50 == 0:
            elapsed = time.time() - start
            print(f"Sent {sent}/{args.total} (elapsed {elapsed:.1f}s)")
        time.sleep(interval)
    print("Done sending", sent)

if __name__ == "__main__":
    main()
