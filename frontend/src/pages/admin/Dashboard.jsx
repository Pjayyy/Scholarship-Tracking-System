import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiRefreshCcw, FiUsers, FiUserCheck, FiShield, FiBell, FiSettings, FiAward, FiTrendingUp, FiClock, FiCheckCircle, FiAlertCircle, FiArrowRight, FiStar, FiActivity, FiPieChart } from "react-icons/fi";
import { toast } from "react-toastify";
import API from "../../services/api";
import { getApiBaseUrl } from "../../services/apiBaseUrl";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatAnnTime(a) {
  try {
    const ts = a.receivedAt || a.createdAt;
    if (!ts) return "—";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "—";
    const diffMs = Date.now() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "today";
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  } catch {
    return "—";
  }
}

function Dashboard() {
  // Real-time: SSE for admin announcement ingestion/dispatched events
  // We update dashboard announcement list + monitoring/proxies on each event.
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    const base = getApiBaseUrl();
    const url = `${base}/admin/announcements/stream?token=${encodeURIComponent(token)}`;

    let es = null;
    let timer = null;

    const refresh = () => {
      void API.get("/dashboard/monitoring-stats")
        .then((r) => setMonitoring(r.data?.data || r.data))
        .catch(() => {});
      void API.get("/dashboard/status-distribution")
        .then((r) => setStatus(r.data?.data || r.data))
        .catch(() => {});
      void API.get("/admin/announcements")
        .then((r) => {
          const list = r.data?.data || [];
          setAnnouncements(list.slice(0, 3));
        })
        .catch(() => {});
    };

    try {
      es = new EventSource(url);
      esRef.current = es;

      // Real-time refresh based on announcement ingest/dispatch events.
      es.addEventListener("ingested", () => refresh());
      es.addEventListener("dispatched", () => refresh());

      es.addEventListener("error", () => {
        // SSE errors are expected during reconnects; keep UI working.
      });

      // Additional polling so Online Now updates even when there are no announcements.
      timer = setInterval(() => refresh(), 1000);


      // initial refresh
      refresh();

      return () => {
        if (timer) clearInterval(timer);
        es?.close?.();
      };
    } catch {
      if (timer) clearInterval(timer);
      return undefined;
    }
  }, [token]);

  const [totalStudents, setTotalStudents] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [monthly, setMonthly] = useState(null);
  const [status, setStatus] = useState(null);
  const [monitoring, setMonitoring] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  const esRef = useRef(null);

  const API_URL = getApiBaseUrl();

  const defaultAnnouncement = useMemo(
    () => [
      { id: "d1", title: "No new announcements yet", bodyText: "Sync Gmail or dispatch pending announcements to see updates.", emailDispatchedAt: null, receivedAt: null, createdAt: new Date().toISOString() },
    ],
    []
  );

  const calcPct = (n, denom) => {
    const d = Number(denom);
    if (!Number.isFinite(d) || d <= 0) return 0;
    return clamp(Math.round(((Number(n) || 0) / d) * 100), 0, 100);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, monthlyRes, statusRes, monitoringRes, annRes] =
        await Promise.allSettled([
          API.get("/dashboard/stats"),
          API.get("/dashboard/monthly-distribution"),
          API.get("/dashboard/status-distribution"),
          API.get("/dashboard/monitoring-stats"),
          API.get("/admin/announcements"),
        ]);

      if (statsRes.status === "fulfilled") {
        setTotalStudents(statsRes.value.data.students);
        setTotalUsers(statsRes.value.data.users);
      }

      if (monthlyRes.status === "fulfilled") {
        const m = monthlyRes.value.data || {};
        const maxAwards = Math.max(1, ...(m.awards || [1]));
        const maxApps = Math.max(1, ...(m.applications || [1]));
        setMonthly({ ...m, max: Math.max(maxAwards, maxApps) });
      }

      if (statusRes.status === "fulfilled") {
        setStatus(statusRes.value.data || null);
      }

      if (monitoringRes.status === "fulfilled") {
        setMonitoring(monitoringRes.value.data || null);
      }

      if (annRes.status === "fulfilled") {
        const list = annRes.value.data?.data || [];
        setAnnouncements(list.slice(0, 3));
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data");
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <motion.div
        className="card-grid fade-in"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {[1, 2, 3].map((i) => (
          <div key={i} className="stat-card skeleton" style={{ minHeight: 140, animation: 'loading 1.5s infinite' }} />
        ))}
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div className="futuristic-card fade-in" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="panel-head">
          <div className="panel-title">
            <FiShield />
            Admin Dashboard
          </div>
          <button className="btn" type="button" onClick={fetchData}>
            <FiRefreshCcw />
            Retry
          </button>
        </div>
        <div className="hint">{error}</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fade-in"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-effects">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
          <div className="hero-orb hero-orb-3"></div>
          <div className="hero-grid"></div>
        </div>
        <div className="hero-content">
          <div className="hero-left">
            <div className="hero-badge">
              <FiActivity />
              <span>Academic Year 2025-2026</span>
            </div>
            <h1 className="hero-title">Scholarship<br /><span className="hero-highlight">Tracking & Monitoring</span></h1>
            <p className="hero-subtitle">Comprehensive management system for scholarship grants, beneficiary tracking, and academic performance analytics.</p>
            <div className="hero-actions">
              <button
                className="btn btn-primary-large"
                type="button"
                onClick={() => {
                  // App page routing uses local state in App.jsx
                  window.dispatchEvent(new CustomEvent("bbai:navigate", { detail: { page: "analytics" } }));
                }}
              >
                <FiTrendingUp />
                View Analytics
              </button>
              <button
                className="btn btn-secondary-large"
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("bbai:navigate", { detail: { page: "forecast" } }));
                }}
              >
                <FiAward />
                Generate Report
              </button>
            </div>

          </div>
          <div className="hero-right">
            <div className="graduation-cap-container">
              <div className="cap-glow"></div>
              <svg className="graduation-cap" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Cap base */}
                <path d="M20 100 L100 130 L180 100 L100 70 Z" fill="url(#capGradient)" stroke="url(#goldStroke)" strokeWidth="2"/>
                {/* Cap top */}
                <path d="M40 85 L100 105 L160 85 L100 65 Z" fill="url(#capTopGradient)" stroke="url(#goldStroke)" strokeWidth="1.5"/>
                {/* Button */}
                <circle cx="100" cy="95" r="6" fill="url(#goldGradient)" stroke="#B8860B" strokeWidth="1"/>
                {/* Tassel */}
                <path d="M100 95 Q130 100 130 130" stroke="url(#tasselGradient)" strokeWidth="3" fill="none" strokeLinecap="round"/>
                <circle cx="130" cy="135" r="8" fill="url(#goldGradient)"/>
                <path d="M122 135 L122 155 M126 135 L126 158 M130 135 L130 156 M134 135 L134 158 M138 135 L138 155" stroke="url(#goldGradient)" strokeWidth="2" strokeLinecap="round"/>
                {/* Board */}
                <rect x="25" y="110" width="150" height="8" rx="2" fill="url(#boardGradient)" stroke="url(#goldStroke)" strokeWidth="1"/>
                {/* Star decorations */}
                <path d="M60 75 L63 81 L70 81 L65 85 L67 92 L60 87 L53 92 L55 85 L50 81 L57 81 Z" fill="url(#goldGradient)" opacity="0.8"/>
                <path d="M140 75 L143 81 L150 81 L145 85 L147 92 L140 87 L133 92 L135 85 L130 81 L137 81 Z" fill="url(#goldGradient)" opacity="0.8"/>
                <defs>
                  <linearGradient id="capGradient" x1="20" y1="100" x2="180" y2="100">
                    <stop offset="0%" stopColor="#1a1a2e"/>
                    <stop offset="50%" stopColor="#24243e"/>
                    <stop offset="100%" stopColor="#1a1a2e"/>
                  </linearGradient>
                  <linearGradient id="capTopGradient" x1="40" y1="75" x2="160" y2="105">
                    <stop offset="0%" stopColor="#2d2d4a"/>
                    <stop offset="100%" stopColor="#1a1a2e"/>
                  </linearGradient>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD700"/>
                    <stop offset="50%" stopColor="#FFC107"/>
                    <stop offset="100%" stopColor="#FFB300"/>
                  </linearGradient>
                  <linearGradient id="tasselGradient" x1="100" y1="95" x2="130" y2="135">
                    <stop offset="0%" stopColor="#FFD700"/>
                    <stop offset="100%" stopColor="#FF8C00"/>
                  </linearGradient>
                  <linearGradient id="boardGradient" x1="25" y1="110" x2="175" y2="118">
                    <stop offset="0%" stopColor="#1a1a2e"/>
                    <stop offset="50%" stopColor="#24243e"/>
                    <stop offset="100%" stopColor="#1a1a2e"/>
                  </linearGradient>
                  <linearGradient id="goldStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#B8860B"/>
                    <stop offset="50%" stopColor="#FFD700"/>
                    <stop offset="100%" stopColor="#B8860B"/>
                  </linearGradient>
                </defs>
              </svg>
              <div className="floating-particles">
                <div className="fp fp-1"></div>
                <div className="fp fp-2"></div>
                <div className="fp fp-3"></div>
                <div className="fp fp-4"></div>
                <div className="fp fp-5"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="stat-card-grid" style={{ marginBottom: 24 }}>
        <StatCard icon={<FiUsers />} title="Total Scholars" value={totalStudents} gradientClass="stat-scanned" trend="+12% from last semester" />
        <StatCard icon={<FiUserCheck />} title="Active Grantees" value={Math.floor(totalStudents * 0.85)} gradientClass="stat-present" trend="98% compliance rate" />
        <StatCard icon={<FiAward />} title="Total Awards" value={totalUsers} gradientClass="stat-late" trend="$2.4M distributed" />
        <StatCard icon={<FiShield />} title="Total Users" value={totalUsers} gradientClass="stat-scanned" trend="System administrators" />
      </div>

        {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Analytics Chart Card */}
        <div className="futuristic-card chart-card">
          <div className="card-header">
            <div className="card-title-group">
              <h3><FiTrendingUp /> Monthly Distribution</h3>
              <span className="card-subtitle">Scholarship awards over time</span>
            </div>
            <div className="chart-legend">
              <span className="legend-item"><span className="legend-dot legend-purple"></span>Awards</span>
              <span className="legend-item"><span className="legend-dot legend-blue"></span>Applications</span>
            </div>
          </div>
          <div className="chart-container">
            <div className="bar-chart">
              {monthly?.labels?.length
                ? monthly.labels.map((label, i) => {
                    const awardsVal = monthly.awards?.[i] ?? 0;
                    const appsVal = monthly.applications?.[i] ?? 0;
                    const denom = Math.max(1, monthly.max || Math.max(...(monthly.awards || [1])));
                    const height = Math.round(((awardsVal + appsVal) / denom) * 100);
                    return (
                      <div key={label} className="bar-wrapper">
                        <div className="bar" style={{ height: `${clamp(height, 0, 100)}%` }}>
                          <div className="bar-glow"></div>
                        </div>
                        <span className="bar-label">{label}</span>
                      </div>
                    );
                  })
                : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((label, i) => (
                    <div key={label} className="bar-wrapper">
                      <div className="bar" style={{ height: `${20 + i * 4}%` }}>
                        <div className="bar-glow"></div>
                      </div>
                      <span className="bar-label">{label}</span>
                    </div>
                  ))}
            </div>
          </div>
        </div>

        {/* Donut Chart Card */}
        <div className="futuristic-card donut-card">
          <div className="card-header">
            <div className="card-title-group">
              <h3><FiPieChart /> Status Distribution</h3>
              <span className="card-subtitle">Current grantee breakdown</span>
            </div>
          </div>
          <div className="donut-container">
            {/* Render 4 rings based on percent values */}
            {(() => {
              const statuses = status?.statuses || [];
              const pSafe = statuses.find((s) => s.key === "SAFE")?.percent ?? 0;
              const pWarning = statuses.find((s) => s.key === "WARNING")?.percent ?? 0;
              const pAtRisk = statuses.find((s) => s.key === "AT RISK")?.percent ?? 0;
              const pProbation = statuses.find((s) => s.key === "PROBATION")?.percent ?? 0;
              const r = 70;
              const circ = 2 * Math.PI * r;
              const dash = (percent) => (circ * percent) / 100;
              let offset = 0;
              const segments = [
                { grad: "donutGradient1", percent: pSafe },
                { grad: "donutGradient2", percent: pWarning },
                { grad: "donutGradient3", percent: pAtRisk },
                { grad: "donutGradient4", percent: pProbation },
              ];

              return (
                <>
                  <svg className="donut" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(108, 99, 255, 0.2)" strokeWidth="25" />
                    {segments.map((seg, idx) => {
                      const d = dash(seg.percent);
                      const gap = circ - d;
                      const curOffset = -offset;
                      offset += d;
                      return (
                        <circle
                          key={idx}
                          cx="100"
                          cy="100"
                          r="70"
                          fill="none"
                          stroke={`url(#${seg.grad})`}
                          strokeWidth="25"
                          strokeDasharray={`${d} ${gap}`}
                          strokeDashoffset={curOffset}
                          transform="rotate(-90 100 100)"
                        />
                      );
                    })}
                    <defs>
                      <linearGradient id="donutGradient1"><stop offset="0%" stopColor="#6C63FF" /><stop offset="100%" stopColor="#4F46E5" /></linearGradient>
                      <linearGradient id="donutGradient2"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#059669" /></linearGradient>
                      <linearGradient id="donutGradient3"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#d97706" /></linearGradient>
                      <linearGradient id="donutGradient4"><stop offset="0%" stopColor="#A5B4FC" /><stop offset="100%" stopColor="#818cf8" /></linearGradient>
                    </defs>
                  </svg>
                  <div className="donut-center">
                    <span className="donut-value">{status?.total ?? 0}</span>
                    <span className="donut-label">Total</span>
                  </div>
                </>
              );
            })()}
          </div>
          <div className="donut-legend">
            {(() => {
              const statuses = status?.statuses || [];
              const get = (key) => statuses.find((s) => s.key === key);
              const safe = get("SAFE")?.percent ?? 0;
              const warning = get("WARNING")?.percent ?? 0;
              const atRisk = get("AT RISK")?.percent ?? 0;
              const probation = get("PROBATION")?.percent ?? 0;
              return (
                <>
                  <div className="donut-legend-item"><span className="legend-bar" style={{ background: 'linear-gradient(135deg, #6C63FF, #4F46E5)' }}></span>Active ({safe}%)</div>
                  <div className="donut-legend-item"><span className="legend-bar" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}></span>Compliant ({warning}%)</div>
                  <div className="donut-legend-item"><span className="legend-bar" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}></span>Pending ({atRisk}%)</div>
                  <div className="donut-legend-item"><span className="legend-bar" style={{ background: 'linear-gradient(135deg, #A5B4FC, #818cf8)' }}></span>Probation ({probation}%)</div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Announcements Panel */}
        <div className="futuristic-card announcement-card">
          <div className="card-header">
            <div className="card-title-group">
              <h3><FiBell /> Announcements</h3>
              <span className="card-subtitle">Latest scholarship news</span>
            </div>
            <button className="btn-small" type="button" onClick={() => window.dispatchEvent(new CustomEvent("bbai:navigate", { detail: { page: "notifications" } }))}>View All</button>
          </div>
          <div className="announcement-list">
            {(announcements?.length ? announcements : defaultAnnouncement).map((a, idx) => (
              <div key={a.id || idx} className={`announcement-item ${a.emailDispatchedAt ? "" : "announcement-urgent"}`}
                onClick={() => window.dispatchEvent(new CustomEvent("bbai:navigate", { detail: { page: "notifications" } }))}
                role="button" tabIndex={0}
              >
                <div className="announcement-icon">
                  {a.emailDispatchedAt ? <FiCheckCircle /> : <FiAlertCircle />}
                </div>
                <div className="announcement-content">
                  <h4>{a.title || "—"}</h4>
                  <p>{(a.bodyText || "").slice(0, 120) || "No content"}</p>
                  <span className="announcement-time"><FiClock /> {formatAnnTime(a)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="futuristic-card quick-actions-card">
          <div className="card-header">
            <div className="card-title-group">
              <h3><FiSettings /> Quick Actions</h3>
            </div>
          </div>
          <div className="quick-actions-grid">
            <button className="quick-action-btn" type="button" onClick={() => window.dispatchEvent(new CustomEvent("bbai:navigate", { detail: { page: "document-scan" } }))}>
              <div className="qa-icon"><FiUserCheck /></div>
              <span>Add Scholar</span>
            </button>
            <button className="quick-action-btn" type="button" onClick={() => window.dispatchEvent(new CustomEvent("bbai:navigate", { detail: { page: "forecast" } }))}>
              <div className="qa-icon"><FiAward /></div>
              <span>New Award</span>
            </button>
            <button className="quick-action-btn" type="button" onClick={() => window.dispatchEvent(new CustomEvent("bbai:navigate", { detail: { page: "document-scan" } }))}>
              <div className="qa-icon"><FiCheckCircle /></div>
              <span>Verify Docs</span>
            </button>
            <button className="quick-action-btn" type="button" onClick={() => window.dispatchEvent(new CustomEvent("bbai:navigate", { detail: { page: "analytics" } }))}>
              <div className="qa-icon"><FiTrendingUp /></div>
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {/* Real-time Monitoring */}
        <div className="futuristic-card monitoring-card">
          <div className="card-header">
            <div className="card-title-group">
              <h3><FiActivity /> Real-time Monitoring</h3>
              <span className="live-indicator"><span className="live-dot"></span>Live</span>
            </div>
          </div>
          <div className="monitoring-stats">
            <div className="monitor-stat">
              <span className="monitor-value">{monitoring?.onlineNow ?? 0}</span>
              <span className="monitor-label">Online Now</span>
              <div className="monitor-bar"><div className="monitor-fill" style={{ width: `${calcPct(monitoring?.onlineNow, monitoring?.totalScannedToday) }%` }}></div></div>
            </div>
            <div className="monitor-stat">
              <span className="monitor-value">{monitoring?.verifyingDocs ?? 0}</span>
              <span className="monitor-label">Verifying Documents</span>
              <div className="monitor-bar"><div className="monitor-fill monitor-fill-warning" style={{ width: `${calcPct(monitoring?.verifyingDocs, monitoring?.totalScannedToday) }%` }}></div></div>
            </div>
            <div className="monitor-stat">
              <span className="monitor-value">{monitoring?.pendingApproval ?? 0}</span>
              <span className="monitor-label">Pending Approval</span>
              <div className="monitor-bar"><div className="monitor-fill monitor-fill-danger" style={{ width: `${calcPct(monitoring?.pendingApproval, monitoring?.totalScannedToday) }%` }}></div></div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, title, value, gradientClass, trend }) {
  return (
    <motion.div className={`stat-card ${gradientClass}`} whileHover={{ y: -6, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
      <div className="stat-top">
        <div className="stat-icon">{icon}</div>
        <div className="stat-title">{title}</div>
      </div>
      <div className="stat-value">{value || 0}</div>
      {trend && <div className="stat-trend">{trend}</div>}
    </motion.div>
  );
}

export default Dashboard;
