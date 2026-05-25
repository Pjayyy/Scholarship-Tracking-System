import { useEffect, useMemo, useState } from "react";
import { FiActivity, FiBarChart2, FiPieChart, FiRefreshCcw } from "react-icons/fi";

import API from "../../services/api";

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

import { Bar, Pie } from "react-chartjs-2";


ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

function Analytics() {
  const [students, setStudents] = useState(0);
  const [users, setUsers] = useState(0);

  const [riskData, setRiskData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Backend currently exposes: GET /dashboard/stats
      const [statsRes, forecastRes] = await Promise.allSettled([
        API.get("/dashboard/stats"),
        API.get("/forecast"),
      ]);

      if (statsRes.status === "fulfilled") {
        setStudents(statsRes.data?.students ?? 0);
        setUsers(statsRes.data?.users ?? 0);

      } else {
        setStudents(0);
        setUsers(0);

      }

      // /forecast may not exist yet; keep UI functional.
      if (forecastRes.status === "fulfilled") {
        const payload = forecastRes.data;
        setRiskData(Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []);
      } else {
        setRiskData([]);
      }
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

  // Keep chart/cards functional even if API returns empty payloads
  const riskCounts = useMemo(() => {
    const safe = riskData.filter((r) => String(r?.risk_level).toUpperCase() === "SAFE").length;
    const warn = riskData.filter((r) => String(r?.risk_level).toUpperCase() === "WARNING").length;
    const risk = riskData.filter((r) => String(r?.risk_level).toUpperCase() === "AT RISK").length;
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
    labels: ["Scholars", "Users"],
    datasets: [
      {
        label: "System Overview",
        data: [students, users],

        // Dashboard palette: purple/indigo + accent
        backgroundColor: ["rgba(108,99,255,0.55)", "rgba(165,180,252,0.55)"],
        borderColor: ["rgba(108,99,255,0.95)", "rgba(79,70,229,0.95)"],

        borderWidth: 1,
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
      {/* Hero (match Dashboard theme) */}
      <section className="hero-section">
        <div className="hero-bg-effects">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
          <div className="hero-orb hero-orb-3"></div>
          <div className="hero-grid"></div>
        </div>

        <div className="hero-content">
          <div className="hero-left">
            <div className="kicker">Analytics</div>
            <h1 className="hero-title">
               Scholarship<br />
              <span className="hero-highlight">System Insights</span>
            </h1>
            <p className="hero-subtitle">Overview, trends, and scholarship risk distribution.</p>
          </div>

          <div className="hero-right">
            <div className="hero-actions" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" type="button" onClick={fetchData} disabled={loading}>
                <FiRefreshCcw />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="stat-card-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card stat-present">
          <div className="stat-top">
            <div className="stat-icon">
              <FiBarChart2 />
            </div>
            <div className="stat-title">Total Scholars</div>
          </div>
          <div className="stat-value">{students}</div>
        </div>

        <div className="stat-card stat-scanned">
          <div className="stat-top">
            <div className="stat-icon">
              <FiActivity />
            </div>
            <div className="stat-title">Total Users</div>
          </div>
          <div className="stat-value">{users}</div>
        </div>
      </div>

      {/* Charts (match Dashboard card layout) */}
      <div className="dashboard-grid">
        <div className="futuristic-card chart-card">
          <div className="card-header">
            <div className="card-title-group">
              <h3>
                <FiBarChart2 /> System Overview
              </h3>
              <span className="card-subtitle">Scholars & users snapshot</span>
            </div>
          </div>
          <div className="chart-container">
            <Bar data={barData} options={commonOptions} />
          </div>
        </div>

        <div className="futuristic-card donut-card">
          <div className="card-header">
            <div className="card-title-group">
              <h3>
                <FiPieChart /> Risk Distribution
              </h3>
              <span className="card-subtitle">SAFE / WARNING / AT RISK</span>
            </div>
          </div>
          <div className="chart-container" style={{ height: 240 }}>
            <Pie data={pieData} options={{ responsive: true, plugins: { legend: { labels: { color: chartText } } } }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
