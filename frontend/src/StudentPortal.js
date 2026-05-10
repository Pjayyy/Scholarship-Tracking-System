import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiHome,
  FiUser,
  FiCode,
  FiBarChart,
  FiTrendingUp,
  FiBell,
  FiFileText,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiClock,
} from "react-icons/fi";
import StudentDashboard from "./StudentPortal/StudentDashboard";
import StudentProfile from "./StudentPortal/StudentProfile";
import StudentQRCode from "./StudentPortal/StudentQRCode";
import AttendanceHistory from "./StudentPortal/AttendanceHistory";
import ForecastPage from "./StudentPortal/ForecastPage";
import StudentNotifications from "./StudentPortal/StudentNotifications";
import ScholarshipDetails from "./StudentPortal/ScholarshipDetails";
import DocumentsRequirements from "./StudentPortal/DocumentsRequirements";
import StudentSettings from "./StudentPortal/StudentSettings";
import "./StudentPortal.css";

function StudentPortal() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(3);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: FiHome },
    { id: "profile", label: "My Profile", icon: FiUser },
    { id: "qr", label: "My QR Code", icon: FiCode },
    { id: "attendance", label: "Attendance History", icon: FiBarChart },
    { id: "forecast", label: "Forecast & Risk", icon: FiTrendingUp },
    { id: "notifications", label: "Notifications", icon: FiBell },
    { id: "scholarship", label: "Scholarship Details", icon: FiFileText },
    { id: "documents", label: "Documents & Requirements", icon: FiFileText },
    { id: "settings", label: "Settings", icon: FiSettings },
  ];

  // Mock student data - Replace with actual API call
  useEffect(() => {
    const mockStudentData = {
      id: 1,
      name: "Maria Santos",
      studentId: "2024-0001",
      awardNumber: "TDP-2024-001",
      email: "maria.santos@university.edu",
      phone: "+63 912 345 6789",
      program: "BSCS",
      yearLevel: "2nd Year",
      scholarshipType: "TDP",
      scholarshipStatus: "Active",
      attendance: 87,
      forecastRisk: "Low",
      qrGenerated: true,
      lastQrScan: "2026-05-10 10:30 AM",
      totalScans: 45,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
      guardian: "Juan Santos",
      birthdate: "2006-03-15",
      contactNumber: "09123456789",
      academicYear: "2024-2025",
    };
    setStudentData(mockStudentData);
    setLoading(false);
  }, []);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <StudentDashboard studentData={studentData} />;
      case "profile":
        return <StudentProfile studentData={studentData} />;
      case "qr":
        return <StudentQRCode studentData={studentData} />;
      case "attendance":
        return <AttendanceHistory studentData={studentData} />;
      case "forecast":
        return <ForecastPage studentData={studentData} />;
      case "notifications":
        return <StudentNotifications />;
      case "scholarship":
        return <ScholarshipDetails studentData={studentData} />;
      case "documents":
        return <DocumentsRequirements studentData={studentData} />;
      case "settings":
        return <StudentSettings studentData={studentData} />;
      default:
        return <StudentDashboard studentData={studentData} />;
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ fontSize: "3rem", color: "white" }}
        >
          ⚡
        </motion.div>
      </div>
    );
  }

  return (
    <div className="student-portal">
      {/* Sidebar */}
      <motion.aside
        className={`student-sidebar ${sidebarOpen ? "open" : "closed"}`}
        initial={false}
      >
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-icon">🎓</span>
            <div className="brand-text">
              <strong>Scholar</strong>
              <span>Track</span>
            </div>
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.slice(0, -1).map((item) => {
            const IconComponent = item.icon;
            return (
              <motion.button
                key={item.id}
                className={`nav-item ${currentPage === item.id ? "active" : ""}`}
                onClick={() => {
                  setCurrentPage(item.id);
                  setMobileMenuOpen(false);
                }}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconComponent size={20} />
                {sidebarOpen && <span>{item.label}</span>}
                {item.id === "notifications" && unreadNotifications > 0 && sidebarOpen && (
                  <span className="badge">{unreadNotifications}</span>
                )}
              </motion.button>
            );
          })}
        </nav>

        <motion.button
          className="nav-item logout-btn"
          onClick={handleLogout}
          whileHover={{ x: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiLogOut size={20} />
          {sidebarOpen && <span>Logout</span>}
        </motion.button>
      </motion.aside>

      {/* Main Content */}
      <div className="student-main">
        {/* Top Navigation */}
        <motion.header
          className="student-topbar"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="topbar-left">
            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <FiMenu size={24} />
            </button>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
              {menuItems.find((m) => m.id === currentPage)?.label || "Dashboard"}
            </h2>
          </div>

          <div className="topbar-center">
            <div className="status-info">
              <FiClock size={16} />
              <span>
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
                {" • "}
                {currentTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="semester-badge">
              <span className="semester-text">2nd Semester • AY 2024-2025</span>
            </div>

            <motion.button
              className="notification-bell"
              onClick={() => setCurrentPage("notifications")}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiBell size={20} />
              {unreadNotifications > 0 && (
                <span className="notification-badge">{unreadNotifications}</span>
              )}
            </motion.button>

            {studentData && (
              <motion.button
                className="profile-avatar"
                onClick={() => setCurrentPage("profile")}
                whileHover={{ scale: 1.05 }}
              >
                <img src={studentData.avatar} alt={studentData.name} />
              </motion.button>
            )}
          </div>
        </motion.header>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="mobile-menu"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`mobile-menu-item ${
                      currentPage === item.id ? "active" : ""
                    }`}
                    onClick={() => {
                      setCurrentPage(item.id);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <IconComponent size={18} />
                    <span>{item.label}</span>
                    {item.id === "notifications" && unreadNotifications > 0 && (
                      <span className="badge">{unreadNotifications}</span>
                    )}
                  </button>
                );
              })}
              <button className="mobile-menu-item logout-btn" onClick={handleLogout}>
                <FiLogOut size={18} />
                <span>Logout</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Content */}
        <main className="student-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default StudentPortal;
