# backend/model/join_and_prepare.py
import pandas as pd
import os

BASE = os.path.dirname(__file__)

records_fp = os.path.join(BASE, "transaction_records.csv")
meta_fp = os.path.join(BASE, "transaction_metadata.csv")
fraud_fp = os.path.join(BASE, "FraudAnalytics-SampleData", "Data", "Fraudulent Patterns", "fraud_indicators.csv")

out_fp = os.path.join(BASE, "train_transactions.csv")

print("Reading:", records_fp)
df_records = pd.read_csv(records_fp)  # TransactionID,Amount,CustomerID
print("Reading:", meta_fp)
df_meta = pd.read_csv(meta_fp)        # TransactionID,Timestamp,MerchantID
print("Reading:", fraud_fp)
df_fraud = pd.read_csv(fraud_fp)      # TransactionID,FraudIndicator

# normalize FraudIndicator -> Class (0/1)
df_fraud = df_fraud.rename(columns={"FraudIndicator":"Class"})
# if FraudIndicator contains booleans or strings like 'Yes'/'No', convert to 1/0
df_fraud['Class'] = df_fraud['Class'].apply(lambda x: 1 if str(x).strip().lower() in ("1","true","yes","y") else 0)

# merge records + metadata
df = pd.merge(df_records, df_meta, on="TransactionID", how="left")
# merge labels
df = pd.merge(df, df_fraud[['TransactionID','Class']], on="TransactionID", how="left")

# Fill missing labels as 0 (non-fraud) if unlabeled
df['Class'] = df['Class'].fillna(0).astype(int)

# Basic feature engineering: keep Amount and Timestamp as numeric features
# (You can add more features or encode MerchantID/CustomerID later)
df['Amount'] = pd.to_numeric(df['Amount'], errors='coerce').fillna(0.0)
df['Timestamp'] = pd.to_numeric(df['Timestamp'], errors='coerce').fillna(0)

# Reorder columns: place Class last (train_model expects Class)
cols = [c for c in df.columns if c != 'Class'] + ['Class']
df = df[cols]

print("Sample rows:")
print(df.head(5))

print("Saving training CSV to:", out_fp)
df.to_csv(out_fp, index=False)
print("Done. Rows:", len(df))
