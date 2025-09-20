// src/components/Charts.jsx  (chart.js version, dark theme tuned)
import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
  ArcElement,
  Title,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip, ArcElement, Title);

export default function Charts({ timeseries = [], kpi = {} }) {
  const lineData = useMemo(() => {
    const points = timeseries.slice().reverse();
    const labels = points.map(p => new Date(p.ts).toLocaleTimeString());
    const totals = points.map(p => p.total || 0);
    const rejects = points.map(p => p.rejected || 0);
    return {
      labels,
      datasets: [
        {
          label: "Total processed (snapshot)",
          data: totals,
          fill: false,
          borderColor: "#4cc9f0",
          backgroundColor: "#4cc9f0",
          tension: 0.3,
          pointRadius: 2
        },
        {
          label: "Rejected (snapshot)",
          data: rejects,
          fill: false,
          borderColor: "#e63946",
          backgroundColor: "#e63946",
          tension: 0.3,
          pointRadius: 2
        },
      ],
    };
  }, [timeseries]);

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom", labels: { color: "#ddd" } },
      title: { display: false },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: {
        ticks: { color: "#bfbfbf" },
        grid: { color: "rgba(255,255,255,0.03)" }
      },
      y: {
        ticks: { color: "#bfbfbf" },
        grid: { color: "rgba(255,255,255,0.03)" }
      }
    }
  };

  const pieData = useMemo(() => {
    const approved = kpi.approved ?? 0;
    const rejected = kpi.rejected ?? 0;
    const other = Math.max(0, (kpi.total ?? 0) - approved - rejected);
    return {
      labels: ["Approved", "Rejected", "Other"],
      datasets: [
        {
          data: [approved, rejected, other],
          backgroundColor: ["#1aa04b", "#e63946", "#7b8790"],
          borderColor: ["#142b16", "#3a0b0b", "#222"],
          borderWidth: 1
        }
      ],
    };
  }, [kpi]);

  const pieOptions = {
    plugins: { legend: { position: "bottom", labels: { color: "#ddd" } } },
    maintainAspectRatio: false
  };

  return (
    <div style={{ display: "flex", gap: 18, alignItems: "flex-start", marginTop: 12, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 380, padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.02)" }}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: "#fff" }}>Throughput & Rejections (time)</div>
        <Line data={lineData} options={lineOptions} />
      </div>

      <div style={{ width: 320, padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.02)", minHeight: 260 }}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: "#fff" }}>Decision Split</div>
        <div style={{ height: 180 }}>
          <Pie data={pieData} options={pieOptions} />
        </div>
        <div style={{ marginTop: 8, color: "#ccc", fontSize: 13 }}>
          <div>Approved: <b style={{ color: "#1aa04b" }}>{kpi.approved ?? 0}</b></div>
          <div>Rejected: <b style={{ color: "#e63946" }}>{kpi.rejected ?? 0}</b></div>
          <div>Total: <b>{kpi.total ?? 0}</b></div>
        </div>
      </div>
    </div>
  );
}
