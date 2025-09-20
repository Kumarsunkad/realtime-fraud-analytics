// src/components/Toast.jsx
import React from "react";

export default function Toast({toasts}) {
  return (
    <div style={{position:"fixed", bottom:20, right:20, zIndex:9999}}>
      {toasts.map(t => (
        <div key={t.id} style={{
          marginBottom:10,
          padding:"12px 16px",
          background:"#1a1a1a",
          borderLeft:`6px solid ${t.severity==="error" ? "#f55" : "#3af"}`,
          borderRadius:8,
          color:"#fff",
          boxShadow:"0 6px 16px rgba(0,0,0,0.5)"
        }}>
          <div style={{fontWeight:700, fontSize:14}}>{t.title}</div>
          <div style={{fontSize:12, color:"#ddd"}}>{t.body}</div>
        </div>
      ))}
    </div>
  );
}
