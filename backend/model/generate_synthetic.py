# backend/model/generate_synthetic.py
import csv, random
cols = [f"V{i}" for i in range(1,29)] + ["Time","Amount","Class"]
with open("backend/model/synthetic_creditcard.csv","w",newline='') as f:
    w = csv.DictWriter(f, fieldnames=cols)
    w.writeheader()
    for _ in range(20000):
        row = {c: round(random.uniform(-10,10),4) for c in cols}
        row["Amount"] = round(random.uniform(1,5000),2)
        row["Time"] = random.randint(0,100000)
        row["Class"] = 1 if random.random() < 0.02 else 0
        w.writerow(row)
print("Wrote backend/model/synthetic_creditcard.csv")
