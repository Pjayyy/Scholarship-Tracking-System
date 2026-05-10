import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FiSearch, FiDownload, FiFilter } from "react-icons/fi";

function AttendanceHistory({ studentData }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [attendanceRecords] = useState([
    {
      id: 1,
      date: "2026-05-10",
      timeIn: "08:30 AM",
      status: "Present",
      qrStatus: "✓ Scanned",
      semester: "2nd",
    },
    {
      id: 2,
      date: "2026-05-09",
      timeIn: "08:45 AM",
      status: "Present",
      qrStatus: "✓ Scanned",
      semester: "2nd",
    },
    {
      id: 3,
      date: "2026-05-08",
      timeIn: "—",
      status: "Absent",
      qrStatus: "✗ Not Scanned",
      semester: "2nd",
    },
    {
      id: 4,
      date: "2026-05-07",
      timeIn: "08:50 AM",
      status: "Present",
      qrStatus: "✓ Scanned",
      semester: "2nd",
    },
    {
      id: 5,
      date: "2026-05-06",
      timeIn: "08:35 AM",
      status: "Present",
      qrStatus: "✓ Scanned",
      semester: "2nd",
    },
  ]);

  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter((record) => {
      const matchesSearch =
        record.date.includes(searchTerm) || record.status.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMonth = !filterMonth || record.date.includes(filterMonth);
      return matchesSearch && matchesMonth;
    });
  }, [searchTerm, filterMonth, attendanceRecords]);

  const stats = useMemo(() => {
    const present = attendanceRecords.filter((r) => r.status === "Present").length;
    const absent = attendanceRecords.filter((r) => r.status === "Absent").length;
    const total = attendanceRecords.length;
    const percentage = Math.round((present / total) * 100);
    return { present, absent, total, percentage };
  }, [attendanceRecords]);

  return (
    <div style={{ padding: "2rem" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "white",
          borderRadius: "1.5rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          border: "1px solid rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            padding: "2rem",
          }}
        >
          <h2 style={{ margin: "0 0 1rem", fontSize: "1.5rem", fontWeight: 700 }}>
            📅 Attendance History
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "1rem",
            }}
          >
            <div>
              <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                Total Sessions
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: "0.25rem" }}>
                {stats.total}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                Present
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: "0.25rem" }}>
                {stats.present}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                Absent
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: "0.25rem" }}>
                {stats.absent}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                Attendance Rate
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: "0.25rem" }}>
                {stats.percentage}%
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            padding: "1.5rem 2rem",
            borderBottom: "1px solid rgba(0,0,0,0.1)",
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
            <FiSearch
              style={{
                position: "absolute",
                left: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af",
              }}
              size={18}
            />
            <input
              type="text"
              placeholder="Search attendance records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem 0.75rem 2.5rem",
                borderRadius: "0.875rem",
                border: "1px solid #e5e7eb",
                fontSize: "0.95rem",
              }}
            />
          </div>

          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.875rem",
              border: "1px solid #e5e7eb",
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            <option value="">All Months</option>
            <option value="05">May 2026</option>
            <option value="04">April 2026</option>
            <option value="03">March 2026</option>
          </select>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.25rem",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <FiDownload size={18} /> Export CSV
          </motion.button>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontWeight: 700 }}>
                  Date
                </th>
                <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontWeight: 700 }}>
                  Time In
                </th>
                <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontWeight: 700 }}>
                  Status
                </th>
                <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontWeight: 700 }}>
                  QR Scan Status
                </th>
                <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontWeight: 700 }}>
                  Semester
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record, idx) => (
                <motion.tr
                  key={record.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    background: record.status === "Absent" ? "rgba(239, 68, 68, 0.05)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      record.status === "Absent"
                        ? "rgba(239, 68, 68, 0.1)"
                        : "rgba(248, 250, 252, 0.8)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      record.status === "Absent"
                        ? "rgba(239, 68, 68, 0.05)"
                        : "transparent";
                  }}
                >
                  <td style={{ padding: "1rem 1.5rem", fontWeight: 600 }}>
                    {record.date}
                  </td>
                  <td style={{ padding: "1rem 1.5rem", color: "#6b7280" }}>
                    {record.timeIn}
                  </td>
                  <td style={{ padding: "1rem 1.5rem" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.4rem 0.8rem",
                        borderRadius: "999px",
                        background:
                          record.status === "Present"
                            ? "rgba(34, 197, 94, 0.1)"
                            : "rgba(239, 68, 68, 0.1)",
                        color:
                          record.status === "Present"
                            ? "#16a34a"
                            : "#dc2626",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                      }}
                    >
                      {record.status === "Present" ? "✓" : "✗"} {record.status}
                    </span>
                  </td>
                  <td style={{ padding: "1rem 1.5rem", color: "#6b7280" }}>
                    {record.qrStatus}
                  </td>
                  <td style={{ padding: "1rem 1.5rem", fontWeight: 600 }}>
                    {record.semester}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

export default AttendanceHistory;
