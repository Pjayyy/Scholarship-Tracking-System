import { useEffect, useMemo, useState } from "react";
import { FiActivity, FiBarChart2, FiPieChart, FiRefreshCcw } from "react-icons/fi";
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

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

function Analytics() {
  const [students, setStudents] = useState(0);
  const [users, setUsers] = useState(0);
  const [attendance, setAttendance] = useState(0);
  const [riskData, setRiskData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [s, u, a, r] = await Promise.all([
        API.get("/dashboard/total-students"),
        API.get("/dashboard/total-users"),
        API.get("/dashboard/today-attendance"),
        API.get("/forecast"),
      ]);

      setStudents(s.data.total || 0);
      setUsers(u.data.total || 0);
      setAttendance(a.data.total || 0);
      setRiskData(Array.isArray(r.data) ? r.data : []);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const riskCounts = useMemo(() => {
    const safe = riskData.filter((r) => r.risk_level === "SAFE").length;
    const warn = riskData.filter((r) => r.risk_level === "WARNING").length;
    const risk = riskData.filter((r) => r.risk_level === "AT RISK").length;
    return { safe, warn, risk };
  }, [riskData]);

  let chartText = "#94a3b8";
  try {
    chartText =
      getComputedStyle(document.documentElement).getPropertyValue("--text-secondary")?.trim() || chartText;
  } catch {
    // ignore
  }
  const chartGrid = "rgba(148,163,184,0.16)";

  const commonOptions = {
    responsive: true,
    plugins: { legend: { labels: { color: chartText } } },
    scales: {
      x: { ticks: { color: chartText }, grid: { color: chartGrid } },
      y: { ticks: { color: chartText }, grid: { color: chartGrid } },
    },
  };

  const barData = {
    labels: ["Scholars", "Users", "Attendance Today"],
    datasets: [
      {
        label: "System Overview",
        data: [students, users, attendance],
        backgroundColor: ["rgba(34,197,94,0.75)", "rgba(56,189,248,0.75)", "rgba(245,158,11,0.75)"],
        borderColor: ["rgba(34,197,94,0.95)", "rgba(56,189,248,0.95)", "rgba(245,158,11,0.95)"],
        borderWidth: 1,
      },
    ],
  };

  const lineData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    datasets: [
      {
        label: "Attendance Trend",
        data: [12, 19, 8, 15, attendance],
        borderColor: "rgba(56,189,248,0.95)",
        backgroundColor: "rgba(56,189,248,0.12)",
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const pieData = {
    labels: ["Safe", "Warning", "At Risk"],
    datasets: [
      {
        data: [riskCounts.safe, riskCounts.warn, riskCounts.risk],
        backgroundColor: ["rgba(34,197,94,0.75)", "rgba(245,158,11,0.75)", "rgba(239,68,68,0.75)"],
        borderColor: ["rgba(34,197,94,0.95)", "rgba(245,158,11,0.95)", "rgba(239,68,68,0.95)"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="panel">
      <section className="page-hero">
        <div className="page-hero__row">
          <div>
            <div className="kicker">Analytics</div>
            <div className="page-title">System Insights</div>
            <div className="page-subtitle">Overview, trends, and scholarship risk distribution.</div>
          </div>
          <div className="hero-actions">
            <button className="btn btn-ghost" type="button" onClick={fetchData} disabled={loading}>
              <FiRefreshCcw />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <div className="stat-card-grid">
        <div className="stat-card stat-present">
          <div className="stat-top">
            <div className="stat-icon">
              <FiBarChart2 />
            </div>
            <div className="stat-title">Scholars</div>
          </div>
          <div className="stat-value">{students}</div>
        </div>
        <div className="stat-card stat-scanned">
          <div className="stat-top">
            <div className="stat-icon">
              <FiActivity />
            </div>
            <div className="stat-title">Users</div>
          </div>
          <div className="stat-value">{users}</div>
        </div>
        <div className="stat-card stat-late">
          <div className="stat-top">
            <div className="stat-icon">
              <FiPieChart />
            </div>
            <div className="stat-title">Attendance Today</div>
          </div>
          <div className="stat-value">{attendance}</div>
        </div>
      </div>

      <div className="attendance-two-col">
        <div className="card card-glass">
          <div className="panel-head">
            <div className="panel-title">
              <FiBarChart2 />
              System Overview
            </div>
          </div>
          <Bar data={barData} options={commonOptions} />
        </div>

        <div className="card card-glass">
          <div className="panel-head">
            <div className="panel-title">
              <FiPieChart />
              Risk Distribution
            </div>
          </div>
          <Pie data={pieData} options={{ responsive: true, plugins: { legend: { labels: { color: chartText } } } }} />
        </div>
      </div>

      <div className="card card-glass">
        <div className="panel-head">
          <div className="panel-title">
            <FiActivity />
            Attendance Trend
          </div>
        </div>
        <Line data={lineData} options={commonOptions} />
      </div>
    </div>
  );
}

export default Analytics;
