import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiRefreshCcw, FiUsers, FiUserCheck, FiShield, FiBell, FiSettings, FiAward, FiTrendingUp, FiClock, FiCheckCircle, FiAlertCircle, FiArrowRight, FiStar, FiActivity, FiPieChart } from "react-icons/fi";
import { toast } from "react-toastify";
import API from "../../services/api";

function Dashboard() {
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const statsRes = await API.get("/dashboard/stats");
      setTotalStudents(statsRes.data.students);
      setTotalUsers(statsRes.data.users);
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
            <h1 className="hero-title">Smart Scholarship<br /><span className="hero-highlight">Tracking & Monitoring</span></h1>
            <p className="hero-subtitle">Comprehensive management system for scholarship grants, beneficiary tracking, and academic performance analytics.</p>
            <div className="hero-actions">
              <button className="btn btn-primary-large">
                <FiTrendingUp />
                View Analytics
              </button>
              <button className="btn btn-secondary-large">
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
              {[65, 85, 45, 90, 75, 95, 70, 88, 60, 92, 78, 85].map((height, i) => (
                <div key={i} className="bar-wrapper">
                  <div className="bar" style={{ height: `${height}%` }}>
                    <div className="bar-glow"></div>
                  </div>
                  <span className="bar-label">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}</span>
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
            <svg className="donut" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(108, 99, 255, 0.2)" strokeWidth="25"/>
              <circle cx="100" cy="100" r="70" fill="none" stroke="url(#donutGradient1)" strokeWidth="25"
                strokeDasharray="130 310" strokeDashoffset="0" transform="rotate(-90 100 100)"/>
              <circle cx="100" cy="100" r="70" fill="none" stroke="url(#donutGradient2)" strokeWidth="25"
                strokeDasharray="95 345" strokeDashoffset="-130" transform="rotate(-90 100 100)"/>
              <circle cx="100" cy="100" r="70" fill="none" stroke="url(#donutGradient3)" strokeWidth="25"
                strokeDasharray="65 375" strokeDashoffset="-225" transform="rotate(-90 100 100)"/>
              <circle cx="100" cy="100" r="70" fill="none" stroke="url(#donutGradient4)" strokeWidth="25"
                strokeDasharray="150 290" strokeDashoffset="-290" transform="rotate(-90 100 100)"/>
              <defs>
                <linearGradient id="donutGradient1"><stop offset="0%" stopColor="#6C63FF"/><stop offset="100%" stopColor="#4F46E5"/></linearGradient>
                <linearGradient id="donutGradient2"><stop offset="0%" stopColor="#10b981"/><stop offset="100%" stopColor="#059669"/></linearGradient>
                <linearGradient id="donutGradient3"><stop offset="0%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#d97706"/></linearGradient>
                <linearGradient id="donutGradient4"><stop offset="0%" stopColor="#A5B4FC"/><stop offset="100%" stopColor="#818cf8"/></linearGradient>
              </defs>
            </svg>
            <div className="donut-center">
              <span className="donut-value">1,247</span>
              <span className="donut-label">Total</span>
            </div>
          </div>
          <div className="donut-legend">
            <div className="donut-legend-item"><span className="legend-bar" style={{background: 'linear-gradient(135deg, #6C63FF, #4F46E5)'}}></span>Active (42%)</div>
            <div className="donut-legend-item"><span className="legend-bar" style={{background: 'linear-gradient(135deg, #10b981, #059669)'}}></span>Compliant (30%)</div>
            <div className="donut-legend-item"><span className="legend-bar" style={{background: 'linear-gradient(135deg, #f59e0b, #d97706)'}}></span>Pending (21%)</div>
            <div className="donut-legend-item"><span className="legend-bar" style={{background: 'linear-gradient(135deg, #A5B4FC, #818cf8)'}}></span>Probation (7%)</div>
          </div>
        </div>

        {/* Announcements Panel */}
        <div className="futuristic-card announcement-card">
          <div className="card-header">
            <div className="card-title-group">
              <h3><FiBell /> Announcements</h3>
              <span className="card-subtitle">Latest scholarship news</span>
            </div>
            <button className="btn-small">View All</button>
          </div>
          <div className="announcement-list">
            <div className="announcement-item announcement-urgent">
              <div className="announcement-icon"><FiAlertCircle /></div>
              <div className="announcement-content">
                <h4>Deadline: Semester Reimbursement</h4>
                <p>Submission deadline approaching. All grantees must submit documents by May 30, 2026.</p>
                <span className="announcement-time"><FiClock /> 2 days remaining</span>
              </div>
            </div>
            <div className="announcement-item">
              <div className="announcement-icon"><FiCheckCircle /></div>
              <div className="announcement-content">
                <h4>Q2 Disbursement Complete</h4>
                <p>$1.2M disbursed to 847 eligible grantees for Academic Year 2025-2026 Q2.</p>
                <span className="announcement-time"><FiClock /> Posted 3 days ago</span>
              </div>
            </div>
            <div className="announcement-item">
              <div className="announcement-icon"><FiStar /></div>
              <div className="announcement-content">
                <h4>Dean's List Recognition</h4>
                <p>Congratulations to 124 scholars who made the Dean's List for Fall 2025 semester.</p>
                <span className="announcement-time"><FiClock /> Posted 1 week ago</span>
              </div>
            </div>
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
            <button className="quick-action-btn">
              <div className="qa-icon"><FiUserCheck /></div>
              <span>Add Scholar</span>
            </button>
            <button className="quick-action-btn">
              <div className="qa-icon"><FiAward /></div>
              <span>New Award</span>
            </button>
            <button className="quick-action-btn">
              <div className="qa-icon"><FiCheckCircle /></div>
              <span>Verify Docs</span>
            </button>
            <button className="quick-action-btn">
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
              <span className="monitor-value">847</span>
              <span className="monitor-label">Online Now</span>
              <div className="monitor-bar"><div className="monitor-fill" style={{width: '78%'}}></div></div>
            </div>
            <div className="monitor-stat">
              <span className="monitor-value">156</span>
              <span className="monitor-label">Verifying Documents</span>
              <div className="monitor-bar"><div className="monitor-fill monitor-fill-warning" style={{width: '45%'}}></div></div>
            </div>
            <div className="monitor-stat">
              <span className="monitor-value">23</span>
              <span className="monitor-label">Pending Approval</span>
              <div className="monitor-bar"><div className="monitor-fill monitor-fill-danger" style={{width: '15%'}}></div></div>
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