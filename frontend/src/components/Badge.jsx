// src/components/Badge.jsx
import React from "react";

export default function Badge({ decision }) {
  const map = {
    APPROVE: { bg: "#0b6623", color: "#d7f7df", label: "APPROVE" },
    REVIEW:  { bg: "#7a5f00", color: "#fff6d0", label: "REVIEW" },
    REJECT:  { bg: "#7a0000", color: "#ffd6d6", label: "REJECT" }
  };
  const s = map[decision] || { bg: "#333", color: "#fff", label: decision || "N/A" };
  return (
    <span style={{
      display: "inline-block",
      padding: "6px 10px",
      borderRadius: 999,
      fontWeight: 700,
      fontSize: 12,
      background: s.bg,
      color: s.color,
      boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.12)"
    }}>
      {s.label}
    </span>
  );
}
