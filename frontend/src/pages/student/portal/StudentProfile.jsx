import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiEdit2, FiSave, FiX, FiUpload } from "react-icons/fi";

function StudentProfile({ studentData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(studentData || {});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = () => {
    setIsEditing(false);
    // API call would go here
  };

  const profileFields = [
    { label: "Full Name", key: "name", type: "text" },
    { label: "Student ID", key: "studentId", type: "text", readonly: true },
    { label: "Award Number", key: "awardNumber", type: "text", readonly: true },
    { label: "Email", key: "email", type: "email" },
    { label: "Phone", key: "contactNumber", type: "tel" },
    { label: "Degree Program", key: "program", type: "text", readonly: true },
    { label: "Year Level", key: "yearLevel", type: "text", readonly: true },
    { label: "Birthdate", key: "birthdate", type: "date" },
    { label: "Guardian Name", key: "guardian", type: "text" },
    { label: "Academic Year", key: "academicYear", type: "text", readonly: true },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "white",
          borderRadius: "1.5rem",
          padding: "2rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          border: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            paddingBottom: "1.5rem",
            borderBottom: "1px solid rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>
            My Profile
          </h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.25rem",
              background: isEditing ? "#ef4444" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isEditing ? (
              <>
                <FiX size={18} /> Cancel
              </>
            ) : (
              <>
                <FiEdit2 size={18} /> Edit Profile
              </>
            )}
          </button>
        </div>

        {/* Profile Picture */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "2.5rem",
            paddingBottom: "2rem",
            borderBottom: "1px solid rgba(0,0,0,0.1)",
          }}
        >
          <img
            src={formData.avatar}
            alt="Profile"
            style={{
              width: "150px",
              height: "150px",
              borderRadius: "50%",
              marginBottom: "1rem",
              border: "4px solid #3b82f6",
              boxShadow: "0 10px 30px rgba(59, 130, 246, 0.3)",
            }}
          />
          {isEditing && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.25rem",
                background: "#f3f4f6",
                color: "#3b82f6",
                border: "1px solid #e5e7eb",
                borderRadius: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <FiUpload size={18} /> Change Picture
            </motion.button>
          )}
        </div>

        {/* Profile Fields */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {profileFields.map((field) => (
            <div key={field.key}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                  color: "#374151",
                }}
              >
                {field.label}
              </label>
              <input
                type={field.type}
                name={field.key}
                value={formData[field.key] || ""}
                onChange={handleInputChange}
                disabled={field.readonly || !isEditing}
                style={{
                  width: "100%",
                  padding: "0.875rem 1rem",
                  borderRadius: "0.875rem",
                  border: `1px solid ${
                    field.readonly || !isEditing
                      ? "#e5e7eb"
                      : "#d1d5db"
                  }`,
                  background: field.readonly || !isEditing ? "#f9fafb" : "white",
                  fontFamily: "inherit",
                  fontSize: "0.95rem",
                  cursor: field.readonly || !isEditing ? "default" : "text",
                }}
              />
            </div>
          ))}
        </div>

        {/* Status Info */}
        <div
          style={{
            marginTop: "2rem",
            padding: "1.5rem",
            background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
            borderRadius: "1rem",
            borderLeft: "4px solid #667eea",
          }}
        >
          <h3 style={{ margin: "0 0 1rem", fontSize: "1.05rem", fontWeight: 700 }}>
            📌 Scholarship Information
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div>
              <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                Scholarship Type
              </span>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "0.25rem" }}>
                {formData.scholarshipType}
              </div>
            </div>
            <div>
              <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                Status
              </span>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "0.25rem", color: "#22c55e" }}>
                ✓ {formData.scholarshipStatus}
              </div>
            </div>
            <div>
              <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                Academic Year
              </span>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "0.25rem" }}>
                {formData.academicYear}
              </div>
            </div>
          </div>
        </div>

        {isEditing && (
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              gap: "1rem",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => setIsEditing(false)}
              style={{
                padding: "0.875rem 1.5rem",
                background: "#f3f4f6",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              style={{
                padding: "0.875rem 1.5rem",
                background: "#22c55e",
                color: "white",
                border: "none",
                borderRadius: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <FiSave size={18} /> Save Changes
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default StudentProfile;
