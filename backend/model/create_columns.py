import csv, json

with open('model/train_transactions.csv', newline='') as f:
    hdr = next(csv.reader(f))

cols = [c for c in hdr if c != "Class"]

with open('model/columns.json', 'w') as out:
    json.dump(cols, out, indent=2)

print("Wrote model/columns.json with columns:", cols)
