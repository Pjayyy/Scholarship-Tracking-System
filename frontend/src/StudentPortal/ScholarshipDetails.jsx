import React from "react";
import { motion } from "framer-motion";
import { FiCheck, FiClock, FiFileText } from "react-icons/fi";

function ScholarshipDetails({ studentData }) {
  const details = [
    {
      label: "Scholarship Program",
      value: "Tuition and Other Educational Expenses (TDP)",
      icon: FiFileText,
    },
    {
      label: "Award Number",
      value: studentData?.awardNumber,
      icon: FiFileText,
    },
    {
      label: "Status",
      value: "Active",
      color: "#22c55e",
      icon: FiCheck,
    },
    {
      label: "Academic Year",
      value: "2024-2025",
      icon: FiClock,
    },
    {
      label: "Current Semester",
      value: "2nd Semester",
      icon: FiClock,
    },
    {
      label: "Grant Amount",
      value: "₱50,000.00",
      icon: FiFileText,
    },
  ];

  const requirements = [
    {
      name: "Valid ID",
      status: "submitted",
      dueDate: "2024-05-31",
      submittedDate: "2024-01-15",
    },
    {
      name: "Enrollment Certificate",
      status: "submitted",
      dueDate: "2024-05-31",
      submittedDate: "2024-01-15",
    },
    {
      name: "Good Moral Character",
      status: "submitted",
      dueDate: "2024-05-31",
      submittedDate: "2024-01-15",
    },
    {
      name: "Medical Certificate",
      status: "pending",
      dueDate: "2026-05-30",
      submittedDate: null,
    },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2
          style={{
            margin: "0 0 2rem",
            fontSize: "1.5rem",
            fontWeight: 700,
          }}
        >
          📋 Scholarship Details
        </h2>

        {/* Scholarship Information */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2.5rem",
          }}
        >
          {details.map((detail, idx) => {
            const Icon = detail.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                style={{
                  background: "white",
                  borderRadius: "1.25rem",
                  padding: "1.5rem",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                  border: "1px solid rgba(0,0,0,0.05)",
                }}
                whileHover={{
                  y: -5,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <Icon
                    size={20}
                    color={detail.color || "#6b7280"}
                  />
                  <span
                    style={{
                      color: "#6b7280",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    {detail.label}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: detail.color || "#111827",
                  }}
                >
                  {detail.value}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Requirements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: "white",
            borderRadius: "1.25rem",
            padding: "2rem",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.2rem", fontWeight: 700 }}>
            ✓ Requirements Status
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {requirements.map((req, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.05 }}
                style={{
                  padding: "1.25rem",
                  background:
                    req.status === "submitted"
                      ? "rgba(34, 197, 94, 0.05)"
                      : "rgba(245, 158, 11, 0.05)",
                  borderRadius: "1rem",
                  borderLeft: `4px solid ${
                    req.status === "submitted" ? "#22c55e" : "#f59e0b"
                  }`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <strong style={{ fontSize: "1.05rem" }}>
                      {req.name}
                    </strong>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "999px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        background:
                          req.status === "submitted"
                            ? "rgba(34, 197, 94, 0.2)"
                            : "rgba(245, 158, 11, 0.2)",
                        color:
                          req.status === "submitted"
                            ? "#16a34a"
                            : "#d97706",
                      }}
                    >
                      {req.status === "submitted" ? "✓ Submitted" : "◐ Pending"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                    {req.status === "submitted"
                      ? `Submitted on ${req.submittedDate}`
                      : `Due by ${req.dueDate}`}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Compliance Summary */}
          <div
            style={{
              marginTop: "2rem",
              padding: "1.5rem",
              background: "#f0fdf4",
              borderRadius: "1rem",
              borderLeft: "4px solid #22c55e",
            }}
          >
            <strong style={{ display: "block", marginBottom: "0.5rem", color: "#16a34a" }}>
              ✓ All Requirements Submitted
            </strong>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "0.95rem" }}>
              You are in good standing with your scholarship requirements.
            </p>
          </div>
        </motion.div>

        {/* Important Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            marginTop: "2rem",
            padding: "1.5rem",
            background: "#fef3c7",
            borderRadius: "1rem",
            borderLeft: "4px solid #f59e0b",
          }}
        >
          <strong style={{ display: "block", marginBottom: "0.75rem", color: "#92400e" }}>
            📢 Important Notes
          </strong>
          <ul
            style={{
              margin: 0,
              paddingLeft: "1.25rem",
              color: "#78350f",
              fontSize: "0.95rem",
            }}
          >
            <li>Maintain attendance rate above 75%</li>
            <li>Submit all required documents by the deadline</li>
            <li>Maintain a minimum GPA of 2.5</li>
            <li>Inform scholarship office of any changes in personal information</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default ScholarshipDetails;
