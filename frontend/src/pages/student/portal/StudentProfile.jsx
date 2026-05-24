import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiEdit2, FiSave, FiX, FiUpload, FiUser } from "react-icons/fi";
import axios from "axios";
import { toast } from "react-toastify";

function StudentProfile({ onProfileUpdate }) {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    student_id: "",
    name: "",
    sex: "",
    birthdate: "",
    contact_number: "",
    course: "",
    year_level: "",
    scholarship_type: "",
    scholarship_status: "",
    award_number: "",
    email: "",
  });

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get("http://localhost:5000/student/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.status === "success" && res.data.data) {
        const data = res.data.data;
        setFormData({
          student_id: data.student_id || "",
          name: data.name || "",
          sex: data.sex || "",
          birthdate: data.birthdate || "",
          contact_number: data.contactNumber || "",
          course: data.program || data.course || "",
          year_level: data.yearLevel || data.year_level || "",
          scholarship_type: data.scholarshipType || data.scholarship_type || "",
          scholarship_status: data.scholarshipStatus || data.scholarship_status || "",
          award_number: data.awardNumber || data.award_number || "",
          email: data.email || "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const token = localStorage.getItem("token");

    try {
      const res = await axios.put(
        "http://localhost:5000/student/me",
        {
          name: formData.name,
          sex: formData.sex,
          birthdate: formData.birthdate,
          contact_number: formData.contact_number,
          course: formData.course,
          year_level: formData.year_level,
          email: formData.email,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.status === "success") {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        // Refresh portal data for all pages
        if (onProfileUpdate) onProfileUpdate();
        // Refresh to show updated data
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchProfile(); // Reset to server data
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading profile...</p>
      </div>
    );
  }

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
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
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
              <FiEdit2 size={18} /> Edit Profile
            </button>
          )}
        </div>

        {/* Avatar Section */}
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
          <div
            style={{
              width: "150px",
              height: "150px",
              borderRadius: "50%",
              marginBottom: "1rem",
              border: "4px solid #3b82f6",
              boxShadow: "0 10px 30px rgba(59, 130, 246, 0.3)",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiUser size={60} color="white" />
          </div>
          <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: 0 }}>
            Profile Photo
          </p>
        </div>

        {/* Profile Fields - Editable */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {/* Full Name - Editable */}
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", color: "#374151" }}>
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                borderRadius: "0.875rem",
                border: `1px solid ${isEditing ? "#d1d5db" : "#e5e7eb"}`,
                background: isEditing ? "white" : "#f9fafb",
                fontFamily: "inherit",
                fontSize: "0.95rem",
                cursor: isEditing ? "text" : "default",
              }}
            />
          </div>

          {/* Email - Editable */}
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", color: "#374151" }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="student@example.com"
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                borderRadius: "0.875rem",
                border: `1px solid ${isEditing ? "#d1d5db" : "#e5e7eb"}`,
                background: isEditing ? "white" : "#f9fafb",
                fontFamily: "inherit",
                fontSize: "0.95rem",
                cursor: isEditing ? "text" : "default",
              }}
            />
          </div>

          {/* Student ID - Read Only */}
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", color: "#374151" }}>
              Student ID
            </label>
            <input
              type="text"
              value={formData.student_id}
              disabled
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                borderRadius: "0.875rem",
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
                fontFamily: "inherit",
                fontSize: "0.95rem",
                cursor: "not-allowed",
                color: "#9ca3af",
              }}
            />
          </div>

          {/* Sex - Editable */}
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", color: "#374151" }}>
              Sex
            </label>
            <select
              name="sex"
              value={formData.sex}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                borderRadius: "0.875rem",
                border: `1px solid ${isEditing ? "#d1d5db" : "#e5e7eb"}`,
                background: isEditing ? "white" : "#f9fafb",
                fontFamily: "inherit",
                fontSize: "0.95rem",
                cursor: isEditing ? "text" : "default",
              }}
            >
              <option value="">Select...</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>

          {/* Birthdate - Editable */}
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", color: "#374151" }}>
              Birthdate
            </label>
            <input
              type="date"
              name="birthdate"
              value={formData.birthdate}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                borderRadius: "0.875rem",
                border: `1px solid ${isEditing ? "#d1d5db" : "#e5e7eb"}`,
                background: isEditing ? "white" : "#f9fafb",
                fontFamily: "inherit",
                fontSize: "0.95rem",
                cursor: isEditing ? "text" : "default",
              }}
            />
          </div>

          {/* Contact Number - Editable */}
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", color: "#374151" }}>
              Phone / Contact Number
            </label>
            <input
              type="tel"
              name="contact_number"
              value={formData.contact_number}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Enter phone number"
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                borderRadius: "0.875rem",
                border: `1px solid ${isEditing ? "#d1d5db" : "#e5e7eb"}`,
                background: isEditing ? "white" : "#f9fafb",
                fontFamily: "inherit",
                fontSize: "0.95rem",
                cursor: isEditing ? "text" : "default",
              }}
            />
          </div>

          {/* Course - Read Only */}
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", color: "#374151" }}>
              Degree Program
            </label>
            <input
              type="text"
              value={formData.course}
              disabled
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                borderRadius: "0.875rem",
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
                fontFamily: "inherit",
                fontSize: "0.95rem",
                cursor: "not-allowed",
                color: "#9ca3af",
              }}
            />
          </div>

          {/* Year Level - Editable */}
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", color: "#374151" }}>
              Year Level
            </label>
            <select
              name="year_level"
              value={formData.year_level}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                borderRadius: "0.875rem",
                border: `1px solid ${isEditing ? "#d1d5db" : "#e5e7eb"}`,
                background: isEditing ? "white" : "#f9fafb",
                fontFamily: "inherit",
                fontSize: "0.95rem",
                cursor: isEditing ? "text" : "default",
              }}
            >
              <option value="">Select...</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
              <option value="5">5th Year</option>
            </select>
          </div>

          {/* Award Number - Read Only */}
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", color: "#374151" }}>
              Award Number
            </label>
            <input
              type="text"
              value={formData.award_number || "—"}
              disabled
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                borderRadius: "0.875rem",
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
                fontFamily: "inherit",
                fontSize: "0.95rem",
                cursor: "not-allowed",
                color: "#9ca3af",
              }}
            />
          </div>
        </div>

        {/* Status Info - Read Only */}
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
            Scholarship Information
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div>
              <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>Scholarship Type</span>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "0.25rem" }}>
                {formData.scholarship_type || "—"}
              </div>
            </div>
            <div>
              <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>Status</span>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "0.25rem", color: "#22c55e" }}>
                {formData.scholarship_status || "Active"}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
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
              onClick={handleCancel}
              disabled={isSaving}
              style={{
                padding: "0.875rem 1.5rem",
                background: "#f3f4f6",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "0.875rem",
                fontWeight: 600,
                cursor: isSaving ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: "0.875rem 1.5rem",
                background: "#22c55e",
                color: "white",
                border: "none",
                borderRadius: "0.875rem",
                fontWeight: 600,
                cursor: isSaving ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              <FiSave size={18} /> {isSaving ? "Saving..." : "Save Changes"}
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default StudentProfile;
