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
    out.sort((a,b)=> sortDesc ? b.score - a.score : a.score - b.score);
    return out;
  }, [events, q, filter, sortDesc]);

  return (
    <div>
      {/* Search + Filter controls */}
      <div style={{display:"flex", gap:8, marginBottom:8, alignItems:"center"}}>
        <input
          placeholder="Search txn_id or score"
          value={q}
          onChange={e=>setQ(e.target.value)}
          style={{padding:8, borderRadius:6, border:"1px solid #333", background:"transparent", color:"#fff"}}
        />
        <select
          value={filter}
          onChange={e=>setFilter(e.target.value)}
          style={{padding:8, borderRadius:6}}
        >
          <option value="ALL">All</option>
          <option value="APPROVE">Approve</option>
          <option value="REVIEW">Review</option>
          <option value="REJECT">Reject</option>
        </select>
        <button
          onClick={()=>setSortDesc(s=>!s)}
          style={{padding:"8px 10px", borderRadius:6}}
        >
          Sort by score {sortDesc ? "↓" : "↑"}
        </button>
      </div>

      {/* Table */}
      <table style={{width:"100%", borderCollapse:"collapse"}}>
        <thead>
          <tr style={{textAlign:"left", color:"#ccc"}}>
            <th style={{padding:8}}>Txn ID</th>
            <th style={{padding:8}}>Score</th>
            <th style={{padding:8}}>Decision</th>
            <th style={{padding:8}}>Latency</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(e => (
            <tr
              key={e.txn_id}
              onClick={()=>onSelect(e)}
              style={{
                cursor:"pointer",
                background: e.decision==="REJECT" ? "rgba(255,0,0,0.08)" :
                           e.decision==="REVIEW" ? "rgba(255,200,0,0.06)" :
                           "rgba(0,255,0,0.04)"
              }}
            >
              <td style={{padding:8}}>{e.txn_id}</td>
              <td style={{padding:8}}>{Number(e.score).toFixed(3)}</td>
              <td style={{padding:8}}><Badge decision={e.decision} /></td>
              <td style={{padding:8}}>{e.latency_ms} ms</td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={4} style={{padding:12, color:"#777"}}>No transactions</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
