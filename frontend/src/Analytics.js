import { useEffect, useState } from "react";
import API from "./api";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar, Line, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
 Tooltip,
  Legend
);

function Analytics() {

  const [students, setStudents] = useState(0);
  const [users, setUsers] = useState(0);
  const [attendance, setAttendance] = useState(0);
  const [riskData, setRiskData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {

    try {

      // ✅ JWT TOKEN AUTO INCLUDED
      const s = await API.get("/dashboard/total-students");

      const u = await API.get("/dashboard/total-users");

      const a = await API.get("/dashboard/today-attendance");

      const r = await API.get("/forecast");

      setStudents(s.data.total);

      setUsers(u.data.total);

      setAttendance(a.data.total);

      setRiskData(r.data);

    } catch (err) {

      console.error(err);

      alert(
        err.response?.data?.message ||
        "Failed to fetch analytics"
      );
    }
  };

  // 📊 BAR CHART
  const barData = {
    labels: ["Students", "Users", "Attendance"],
    datasets: [
      {
        label: "System Overview",
        data: [students, users, attendance],
        backgroundColor: [
          "#4CAF50",
          "#2196F3",
          "#FF9800",
        ],
      },
    ],
  };

  // 📈 LINE CHART
  const lineData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    datasets: [
      {
        label: "Attendance Trend",
        data: [12, 19, 8, 15, attendance],
        borderColor: "#2563eb",
        tension: 0.4,
      },
    ],
  };

  // 🟠 PIE CHART
  const safe = riskData.filter(
    (r) => r.risk_level === "SAFE"
  ).length;

  const warn = riskData.filter(
    (r) => r.risk_level === "WARNING"
  ).length;

  const risk = riskData.filter(
    (r) => r.risk_level === "AT RISK"
  ).length;

  const pieData = {
    labels: ["Safe", "Warning", "At Risk"],
    datasets: [
      {
        data: [safe, warn, risk],
        backgroundColor: [
          "#22c55e",
          "#f59e0b",
          "#ef4444",
        ],
      },
    ],
  };

  return (
    <div style={{ padding: 20 }}>

      <h1>📊 Analytics Dashboard</h1>

      {/* BAR CHART */}
      <div style={{ width: "600px" }}>
        <h3>System Overview</h3>

        <Bar data={barData} />
      </div>

      <br />

      {/* LINE CHART */}
      <div style={{ width: "600px" }}>
        <h3>Attendance Trend</h3>

        <Line data={lineData} />
      </div>

      <br />

      {/* PIE CHART */}
      <div style={{ width: "400px" }}>
        <h3>Scholarship Risk Distribution</h3>

        <Pie data={pieData} />
      </div>

    </div>
  );
}

export default Analytics;