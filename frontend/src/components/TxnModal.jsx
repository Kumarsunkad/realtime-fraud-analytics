// frontend/src/components/TxnModal.jsx
import React from "react";

export default function TxnModal({txn, onClose}) {
  if (!txn) return null;
  const modelMsgs = txn.models || txn.model_msgs || {};
  const pretty = JSON.stringify(modelMsgs, null, 2);
  return (
    <div style={{position:"fixed", right:30, top:40, width:420, zIndex:999, background:"#111", border:"1px solid #333", padding:16, borderRadius:8}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <h4 style={{margin:0}}>Txn {txn.txn_id}</h4>
        <button onClick={onClose} style={{background:"transparent", border:"none", color:"#ccc", cursor:"pointer"}}>Close</button>
      </div>
      <div style={{marginTop:8}}>
        <b>Decision:</b> {txn.decision}<br/>
        <b>Score:</b> {Number(txn.score).toFixed(4)}<br/>
        <b>Latency:</b> {txn.latency_ms} ms
      </div>
      <div style={{marginTop:12}}>
        <b>Model details</b>
        <pre style={{maxHeight:260, overflow:"auto", background:"#0b0b0b", padding:8, borderRadius:6}}>{pretty}</pre>
      </div>
    </div>
  );
}
