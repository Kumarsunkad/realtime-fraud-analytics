// src/components/KpiPanel.jsx
import React from "react";

export default function KpiPanel({metrics}) {
  return (
    <div style={{display:"flex", gap:16, alignItems:"center", marginBottom:16}}>
      <Card title="Total" value={metrics.total ?? 0} />
      <Card title="Approved" value={metrics.approved ?? 0} accent="#1aa04b" />
      <Card title="Rejected" value={metrics.rejected ?? 0} accent="#e63946" />
      <Card title="Avg Latency (ms)" value={Math.round(metrics.avg_latency_ms ?? 0)} />
    </div>
  );
}

function Card({title, value, accent}) {
  return (
    <div style={{
      flex:1,
      padding:"16px 20px",
      borderRadius:12,
      background:"linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
      boxShadow:"0 6px 18px rgba(0,0,0,0.4)",
      border:"1px solid rgba(255,255,255,0.05)"
    }}>
      <div style={{fontSize:13, color:"#9aa", marginBottom:4}}>{title}</div>
      <div style={{fontSize:22, fontWeight:700, color:accent || "#fff"}}>{value}</div>
    </div>
  );
}
