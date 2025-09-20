// src/App.jsx
import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";

import KpiPanel from "./components/KpiPanel";
import LiveTable from "./components/LiveTable";
import TxnModal from "./components/TxnModal";
import Charts from "./components/Charts";
import Toast from "./components/Toast";
import ThresholdSlider from "./components/ThresholdSlider";

// ---- Styles for header ----
const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 18,
  padding: "12px 16px",
  borderRadius: 8,
  background: "#0f1113",
  boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
};
const logoStyle = {
  width: 44,
  height: 44,
  borderRadius: 10,
  fontSize: 22,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#101214",
};
const headerBtn = {
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.06)",
  padding: "6px 10px",
  borderRadius: 6,
  color: "#ddd",
  cursor: "pointer",
};

// Backend endpoints
const API_URL = "http://127.0.0.1:5000";
const SOCKET_NS = API_URL; // socket server base

// ---------- Export / Copy helpers ----------
function exportCsvRows(rows, filename = "transactions.csv") {
  if (!rows || rows.length === 0) return;
  // Build header from keys (flatten model_msgs)
  const keys = Object.keys(rows[0]).filter((k) => k !== "model_msgs" && k !== "models");
  const header = keys.concat(["model_msgs"]).join(",");
  const lines = [header];
  for (const r of rows) {
    const row = [];
    for (const k of keys) {
      let val = r[k];
      if (val === undefined || val === null) val = "";
      const s = String(val).replace(/"/g, '""');
      row.push(`"${s}"`);
    }
    const mm = r.model_msgs ? JSON.stringify(r.model_msgs).replace(/"/g, '""') : "";
    row.push(`"${mm}"`);
    lines.push(row.join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function copyJsonToClipboard(obj) {
  const s = JSON.stringify(obj, null, 2);
  navigator.clipboard
    .writeText(s)
    .then(() => {
      console.log("Copied JSON to clipboard");
    })
    .catch((e) => console.error("Copy failed", e));
}

export default function App() {
  const [kpi, setKpi] = useState({});
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [toasts, setToasts] = useState([]);
  const socketRef = useRef();

  // ---- Socket.IO connection + realtime events ----
  useEffect(() => {
    // connect (use websocket transport)
    // Note: if you see WebSocket warnings, ensure backend socket.io server is running at API_URL
    socketRef.current = io(SOCKET_NS, { transports: ["websocket"], path: "/socket.io" });
    socketRef.current.on("connect", () => console.log("✅ Socket connected"));

    socketRef.current.on("event", (ev) => {
      // mark row new for animation
      ev.isNew = true;
      setEvents((prev) => [{ ...ev }, ...prev].slice(0, 500));

      // remove "new" flag shortly after so animation plays only once
      setTimeout(() => {
        setEvents((prev) => prev.map((x) => (x.txn_id === ev.txn_id ? { ...x, isNew: false } : x)));
      }, 1000);

      // toast on REJECT
      if (ev.decision === "REJECT") {
        const toast = {
          id: Date.now(),
          title: "🚨 Fraud Alert",
          body: `Txn ${ev.txn_id} rejected (score ${Number(ev.score).toFixed(3)})`,
          severity: "error",
        };
        setToasts((prev) => [toast, ...prev].slice(0, 5));
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), 5000);
      }
    });

    socketRef.current.on("disconnect", () => console.log("Socket disconnected"));
    return () => {
      try {
        socketRef.current.disconnect();
      } catch (e) {
        /* ignore */
      }
    };
  }, []);

  // ---- Poll metrics every 3s ----
  useEffect(() => {
    let mounted = true;
    const fetchMetrics = async () => {
      try {
        const res = await axios.get(`${API_URL}/metrics`);
        if (!mounted) return;
        setKpi(res.data || {});
        setTimeseries((prev) => {
          const next = [{ ts: Date.now(), total: res.data.total || 0, rejected: res.data.rejected || 0 }, ...prev];
          return next.slice(0, 120);
        });
      } catch (e) {
        console.error("metrics fetch error", e);
      }
    };
    fetchMetrics();
    const t = setInterval(fetchMetrics, 3000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <header style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={logoStyle}>🛡️</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Real-Time Fraud Analytics</div>
            <div style={{ fontSize: 12, color: "#9aa" }}>BNP Paribas — Hackathon Demo</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => exportCsvRows(events, `transactions_${Date.now()}.csv`)} style={headerBtn}>
            Export CSV
          </button>

          <button onClick={() => copyJsonToClipboard(events)} style={headerBtn}>
            Copy JSON
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <KpiPanel metrics={kpi} />

      {/* Controls row: Threshold + Charts */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* Threshold slider (left column) */}
        <div style={{ width: 320 }}>
          <ThresholdSlider />
        </div>

        {/* Charts (right column, flexible) */}
        <div style={{ flex: 1 }}>
          <Charts timeseries={timeseries} kpi={kpi} />
        </div>
      </div>

      {/* Live Transactions */}
      <h3 style={{ marginTop: 24, color: "#fff" }}>Live Transactions</h3>
      <LiveTable events={events} onSelect={setSelected} />
      <TxnModal txn={selected} onClose={() => setSelected(null)} />

      {/* Toast Notifications */}
      <Toast toasts={toasts} />
    </div>
  );
}
