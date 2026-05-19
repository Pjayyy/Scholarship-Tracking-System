import {
  FaBell,
  FaBullhorn,
  FaChartLine,
  FaCloudUploadAlt,
  FaHome,
  FaQrcode,
  FaRegChartBar,
  FaUniversity,
  FaUser,
  FaUserGraduate,
  FaFileAlt,
  FaCog,
} from "react-icons/fa";

const adminNavItems = [
  { page: "dashboard", label: "Dashboard", icon: FaHome },
  { page: "students", label: "Students", icon: FaUserGraduate },
  { page: "document-scan", label: "Document scan", icon: FaCloudUploadAlt },
  { page: "qr", label: "QR Announcements", icon: FaQrcode },
  { page: "forecast", label: "Forecast", icon: FaChartLine },
  { page: "notifications", label: "Announcements", icon: FaBullhorn },
  { page: "analytics", label: "Analytics", icon: FaRegChartBar },
];

const studentNavItems = [
  { page: "student-dashboard", label: "Dashboard", icon: FaHome },
  { page: "student-profile", label: "My Profile", icon: FaUser },
  { page: "student-qr", label: "My QR Code", icon: FaQrcode },
  { page: "student-attendance", label: "Attendance History", icon: FaRegChartBar },
  { page: "student-forecast", label: "Forecast & Risk", icon: FaChartLine },
  { page: "student-notifications", label: "Notifications", icon: FaBell },
  { page: "student-scholarship", label: "Scholarship Details", icon: FaFileAlt },
  { page: "student-documents", label: "Documents", icon: FaFileAlt },
  { page: "student-settings", label: "Settings", icon: FaCog },
];

function Sidebar({ page, setPage, role }) {
  const navItems = role === "student" ? studentNavItems : adminNavItems;

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <span aria-hidden="true">
          <FaUniversity />
        </span>
        <div>
          <small className="kicker">Scholarship Intelligence</small>
          <strong>Smart Tracking</strong>
          <small>Monitoring &amp; Analytics</small>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.page}
              type="button"
              className={page === item.page ? "active" : ""}
              onClick={() => setPage(item.page)}
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <small>Real-time monitoring UI</small>
      </div>
    </div>
  );
}

export default Sidebar;
