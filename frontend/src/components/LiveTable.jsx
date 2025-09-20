// src/components/LiveTable.jsx
import React, { useMemo, useState } from "react";
import Badge from "./Badge";

export default function LiveTable({ events, onSelect }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL / APPROVE / REVIEW / REJECT
  const [sortDesc, setSortDesc] = useState(true);

  const filtered = useMemo(() => {
    let out = events.slice();
    if (filter !== "ALL") out = out.filter(e => e.decision === filter);
    if (q) out = out.filter(e => e.txn_id.includes(q) || String(e.score).includes(q));
    out.sort((a, b) => sortDesc ? b.score - a.score : a.score - b.score);
    return out;
  }, [events, q, filter, sortDesc]);

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
        <input
          placeholder="Search txn_id or score"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="ALL">All</option>
          <option value="APPROVE">Approve</option>
          <option value="REVIEW">Review</option>
          <option value="REJECT">Reject</option>
        </select>
        <button onClick={() => setSortDesc(s => !s)}>
          Sort by score {sortDesc ? "↓" : "↑"}
        </button>
      </div>

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th>Txn ID</th>
            <th>Score</th>
            <th>Decision</th>
            <th>Latency</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(e => (
            <tr
              key={e.txn_id}
              onClick={() => onSelect(e)}
              className={"table-row " + (e.isNew ? "new" : "")}
              style={{ cursor: "pointer" }}
            >
              <td>{e.txn_id}</td>
              <td>{Number(e.score).toFixed(3)}</td>
              <td><Badge decision={e.decision} /></td>
              <td>{e.latency_ms} ms</td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: 12, color: "#777" }}>
                No transactions
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
