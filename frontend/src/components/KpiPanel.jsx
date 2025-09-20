// frontend/src/components/KpiPanel.jsx
import React from "react";

export default function KpiPanel({metrics}) {
  return (
    <div style={{display:"flex", gap:12, alignItems:"center", marginBottom:16}}>
      <Card>
        <div className="label">Total</div>
        <div className="value">{metrics.total ?? 0}</div>
      </Card>
      <Card>
        <div className="label">Approved</div>
        <div className="value" style={{color:"#1aa04b"}}>{metrics.approved ?? 0}</div>
      </Card>
      <Card>
        <div className="label">Rejected</div>
        <div className="value" style={{color:"#d33"}}>{metrics.rejected ?? 0}</div>
      </Card>
      <Card>
        <div className="label">Avg Latency (ms)</div>
        <div className="value">{Math.round(metrics.avg_latency_ms ?? 0)}</div>
      </Card>
    </div>
  );
}

function Card({children}) {
  return <div style={{padding:12, border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, minWidth:120, background:"rgba(255,255,255,0.02)"}}>{children}</div>
}
