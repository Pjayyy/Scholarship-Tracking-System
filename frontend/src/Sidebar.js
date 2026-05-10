import {
  FaBell,
  FaChartLine,
  FaHome,
  FaQrcode,
  FaRegChartBar,
  FaUserGraduate,
  FaUser,
} from "react-icons/fa";

const adminNavItems = [
  { page: "dashboard", label: "Dashboard", icon: FaHome },
  { page: "students", label: "Students", icon: FaUserGraduate },
  { page: "qr", label: "QR Attendance", icon: FaQrcode },
  { page: "forecast", label: "Forecast", icon: FaChartLine },
  { page: "notifications", label: "Notifications", icon: FaBell },
  { page: "analytics", label: "Analytics", icon: FaRegChartBar },
];

const studentNavItems = [
  { page: "student-portal", label: "Student Portal", icon: FaUser },
];

function Sidebar({ page, setPage, role }) {
  const navItems = role === "student" ? studentNavItems : adminNavItems;

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <span>🎓</span>
        <div>
          <strong>Scholarship</strong>
          <small>Operations</small>
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
        <small>Modern dashboard UI</small>
      </div>
    </div>
  );
}

export default Sidebar;