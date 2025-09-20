import React, {useEffect, useState, useRef} from "react";
import io from "socket.io-client";
import axios from "axios";
import KpiPanel from "./components/KpiPanel";
import LiveTable from "./components/LiveTable";
import TxnModal from "./components/TxnModal";
import Charts from "./components/Charts";

const API_URL = "http://localhost:5000";
const SOCKET_NS = "http://localhost:5000/events";

export default function App(){
  const [kpi, setKpi] = useState({});
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const socketRef = useRef();

  useEffect(() => {
    // connect socket to namespace /events
    socketRef.current = io(SOCKET_NS, { transports: ["websocket"] });
    socketRef.current.on("connect", ()=> console.log("socket connected"));
    socketRef.current.on("event", (ev) => {
      setEvents(prev => [{...ev}, ...prev].slice(0, 500));
    });
    return ()=> socketRef.current.disconnect();
  }, []);

  // poll metrics
  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const res = await axios.get(`${API_URL}/metrics`);
        if(!mounted) return;
        setKpi(res.data);
        // append timeseries point
        setTimeseries(prev => {
          const next = [{ts: Date.now(), total: res.data.total||0, rejected: res.data.rejected||0}, ...prev].slice(0,60);
          return next;
        });
      } catch(e){ console.error(e) }
    };
    fetch();
    const t = setInterval(fetch, 3000);
    return ()=>{ mounted=false; clearInterval(t); }
  }, []);

  return (
    <div style={{padding:20}}>
      <h2>🚨 Real-Time Fraud Dashboard</h2>
      <KpiPanel metrics={kpi} />
      <Charts timeseries={timeseries} />
      <h3 style={{marginTop:24}}>Live Transactions</h3>
      <LiveTable events={events} onSelect={setSelected} />
      <TxnModal txn={selected} onClose={()=>setSelected(null)} />
    </div>
  );
}
