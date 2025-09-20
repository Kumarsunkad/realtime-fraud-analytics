// frontend/src/components/Charts.jsx
import React from "react";
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip } from 'chart.js';
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip);

export default function Charts({timeseries}) {
  // timeseries: [{ts: epoch_ms, approved: n, rejected: m, total: k}, ...]
  const labels = timeseries.map(t => new Date(t.ts).toLocaleTimeString());
  const totals = timeseries.map(t => t.total);
  const rejects = timeseries.map(t => t.rejected);
  return (
    <div style={{width:"100%", marginTop:12}}>
      <Line data={{
        labels,
        datasets: [
          { label: "Total TPS (per snapshot)", data: totals, fill:false, tension:0.3 },
          { label: "Rejected", data: rejects, fill:false, tension:0.3 }
        ]
      }} options={{responsive:true, plugins:{legend:{position:"bottom"}}}} />
    </div>
  );
}
