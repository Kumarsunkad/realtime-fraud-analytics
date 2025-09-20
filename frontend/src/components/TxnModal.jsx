// frontend/src/components/TxnModal.jsx
import React from "react";
import { Badge } from "./Badge";

/**
 * Props:
 *  - open (bool)
 *  - onClose (fn)
 *  - txn (object) // full transaction object including model decision/score and model_msgs
 *
 * Expected txn shape (example):
 * {
 *   txn_id: 'abc123',
 *   Amount: 123.45,
 *   CustomerID: 555,
 *   MerchantID: 2701,
 *   Timestamp: 1690000000,
 *   decision: 'REVIEW',
 *   score: 0.78,
 *   model_msgs: [
 *     "high_amount",
 *     "new_merchant",
 *     "isolation_outlier:true",
 *     "rf_prob:0.91"
 *   ],
 *   features: { ... } // optional map of raw features
 * }
 */

const prettyMap = {
  high_amount: "Transaction amount is unusually high for this customer",
  new_merchant: "Merchant is new/unusual for this customer",
  velocity_high: "Many transactions in short time window",
  geo_mismatch: "Location/device mismatch detected",
  isolation_outlier: "Marked as outlier by anomaly detector",
  rf_prob: "RandomForest predicted high fraud probability",
  missing_address: "Missing or suspicious address data",
  card_present: "Card-not-present anomaly",
  // add more known tokens here as you add rules
};

function parseModelMsgs(msgs = []) {
  // transform strings like "isolation_outlier:true" to object {k: v}
  return msgs.map((m) => {
    if (typeof m !== "string") return { raw: String(m) };
    const [k, ...rest] = m.split(":");
    const v = rest.length ? rest.join(":") : true;
    const pretty = prettyMap[k] || k.replace(/_/g, " ");
    return { key: k, value: v, pretty };
  });
}

function ScoreBadge({ score }) {
  if (score == null) return null;
  const s = Number(score);
  if (s >= 0.8) return <span className="px-2 py-1 rounded bg-red-600 text-white text-sm">High risk ({s.toFixed(2)})</span>;
  if (s >= 0.5) return <span className="px-2 py-1 rounded bg-yellow-500 text-black text-sm">Medium risk ({s.toFixed(2)})</span>;
  return <span className="px-2 py-1 rounded bg-green-600 text-white text-sm">Low risk ({s.toFixed(2)})</span>;
}

export default function TxnModal({ open, onClose, txn }) {
  if (!open) return null;
  if (!txn) return null;

  const parsed = parseModelMsgs(txn.model_msgs || txn.model_msgs?.split?.(",") || []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-start justify-between p-4 border-b dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold dark:text-white">Transaction — {txn.txn_id || txn.TransactionID || "—"}</h3>
            <div className="mt-1 flex items-center gap-3">
              <Badge decision={txn.decision} />
              <ScoreBadge score={txn.score} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left: core fields */}
          <div className="md:col-span-1 space-y-2">
            <h4 className="text-sm font-medium dark:text-gray-200">Core details</h4>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <div><strong>Amount:</strong> ₹{Number(txn.Amount || txn.amount || 0).toFixed(2)}</div>
              <div><strong>Customer:</strong> {txn.CustomerID ?? txn.customer_id ?? "—"}</div>
              <div><strong>Merchant:</strong> {txn.MerchantID ?? txn.merchant_id ?? "—"}</div>
              <div><strong>Time:</strong> {txn.Timestamp ? new Date(txn.Timestamp * 1000).toLocaleString() : "—"}</div>
              <div className="mt-2">
                <strong>Raw score:</strong> {txn.score != null ? Number(txn.score).toFixed(3) : "—"}
              </div>
            </div>
          </div>

          {/* Middle: explain card */}
          <div className="md:col-span-1 bg-gray-50 dark:bg-gray-800 rounded p-3">
            <h4 className="text-sm font-medium mb-2 dark:text-gray-200">Why the model flagged this</h4>
            {parsed.length === 0 ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">No model messages available.</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {parsed.map((m, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {/* simple icon by type */}
                      {String(m.key).includes("outlier") ? "🔎" : String(m.key).includes("prob") ? "⚠️" : "💡"}
                    </div>
                    <div>
                      <div className="font-medium dark:text-gray-100">{m.pretty}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {m.value === true ? "" : `Details: ${String(m.value)}`}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Right: quick feature table */}
          <div className="md:col-span-1">
            <h4 className="text-sm font-medium mb-2 dark:text-gray-200">Key features</h4>
            <div className="text-sm">
              {txn.features && Object.keys(txn.features).length > 0 ? (
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(txn.features).slice(0, 8).map(([k, v]) => (
                      <tr key={k} className="border-b dark:border-gray-700">
                        <td className="py-1 pr-3 text-gray-600 dark:text-gray-300">{k}</td>
                        <td className="py-1 font-medium dark:text-gray-100">{String(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-gray-600 dark:text-gray-400">No feature map provided.</div>
              )}
            </div>

            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Tip: model messages come from backend `model_msgs` field. Add more tokens to `prettyMap` for friendlier text.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-3 border-t dark:border-gray-700">
          <button
            onClick={() => { navigator.clipboard?.writeText(JSON.stringify(txn, null, 2)); }}
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm"
          >
            Copy JSON
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded bg-blue-600 text-white text-sm">Close</button>
        </div>
      </div>
    </div>
  );
}
