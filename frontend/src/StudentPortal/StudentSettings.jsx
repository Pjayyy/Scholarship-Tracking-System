import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiLock, FiBell, FiMoon, FiSave, FiEye, FiEyeOff } from "react-icons/fi";

function StudentSettings({ studentData }) {
  const [activeTab, setActiveTab] = useState("account");
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: true,
    smsNotifications: true,
    attendanceAlerts: true,
    scholarshipUpdates: true,
    darkMode: false,
  });

  const [changesSaved, setChangesSaved] = useState(false);

  const handleSettingChange = (key) => {
    if (key === "darkMode") {
      setSettings({ ...settings, [key]: !settings[key] });
    } else {
      setSettings({ ...settings, [key]: !settings[key] });
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
  };

  const handleSaveChanges = () => {
    setChangesSaved(true);
    setTimeout(() => setChangesSaved(false), 3000);
  };

  const tabs = [
    { id: "account", label: "Account Settings", icon: FiLock },
    { id: "notifications", label: "Notifications", icon: FiBell },
    { id: "appearance", label: "Appearance", icon: FiMoon },
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
          ⚙️ Settings
        </h2>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "2rem",
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: "1rem",
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1.25rem",
                  background: activeTab === tab.id ? "#3b82f6" : "#f3f4f6",
                  color: activeTab === tab.id ? "white" : "#374151",
                  border: "none",
                  borderRadius: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Icon size={18} /> {tab.label}
              </motion.button>
            );
          })}
        </div>

        {/* Account Settings Tab */}
        {activeTab === "account" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: "white",
              borderRadius: "1.25rem",
              padding: "2rem",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              border: "1px solid rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.1rem", fontWeight: 700 }}>
              Change Password
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "1.5rem",
                marginBottom: "2rem",
              }}
            >
              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem" }}>
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={settings.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
                    borderRadius: "0.875rem",
                    border: "1px solid #e5e7eb",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem" }}>
                  New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="newPassword"
                    value={settings.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    style={{
                      width: "100%",
                      padding: "0.875rem 1rem 0.875rem 2.75rem",
                      borderRadius: "0.875rem",
                      border: "1px solid #e5e7eb",
                      fontSize: "0.95rem",
                    }}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "1rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#6b7280",
                      cursor: "pointer",
                      padding: "0.5rem",
                    }}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem" }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={settings.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
                    borderRadius: "0.875rem",
                    border: "1px solid #e5e7eb",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveChanges}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.875rem 1.5rem",
                background: "#22c55e",
                color: "white",
                border: "none",
                borderRadius: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <FiSave size={18} /> Update Password
            </motion.button>
          </motion.div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: "white",
              borderRadius: "1.25rem",
              padding: "2rem",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              border: "1px solid rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.1rem", fontWeight: 700 }}>
              Notification Preferences
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { key: "emailNotifications", label: "Email Notifications", description: "Receive updates via email" },
                { key: "smsNotifications", label: "SMS Notifications", description: "Receive updates via SMS" },
                { key: "attendanceAlerts", label: "Attendance Alerts", description: "Get notified about attendance changes" },
                { key: "scholarshipUpdates", label: "Scholarship Updates", description: "Receive scholarship-related news" },
              ].map((pref) => (
                <motion.div
                  key={pref.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1.25rem",
                    background: "#f9fafb",
                    borderRadius: "1rem",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                      {pref.label}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                      {pref.description}
                    </div>
                  </div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={settings[pref.key]}
                      onChange={() => handleSettingChange(pref.key)}
                      style={{ width: "20px", height: "20px", cursor: "pointer" }}
                    />
                  </label>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Appearance Tab */}
        {activeTab === "appearance" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: "white",
              borderRadius: "1.25rem",
              padding: "2rem",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              border: "1px solid rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.1rem", fontWeight: 700 }}>
              Appearance Settings
            </h3>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1.5rem",
                background: "#f9fafb",
                borderRadius: "1rem",
                border: "1px solid #e5e7eb",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <FiMoon size={20} /> Dark Mode
                </div>
                <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                  Enable dark theme for reduced eye strain
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={() => handleSettingChange("darkMode")}
                  style={{ width: "20px", height: "20px", cursor: "pointer" }}
                />
              </label>
            </motion.div>

            <div
              style={{
                marginTop: "1.5rem",
                padding: "1.25rem",
                background: "#f0f9ff",
                borderRadius: "0.875rem",
                fontSize: "0.9rem",
                color: "#1e40af",
                borderLeft: "4px solid #3b82f6",
              }}
            >
              Dark mode feature coming soon!
            </div>
          </motion.div>
        )}

        {/* Success Message */}
        {changesSaved && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed",
              bottom: "2rem",
              right: "2rem",
              background: "#22c55e",
              color: "white",
              padding: "1rem 1.5rem",
              borderRadius: "0.875rem",
              fontWeight: 600,
              boxShadow: "0 10px 30px rgba(34, 197, 94, 0.3)",
            }}
          >
            ✓ Changes saved successfully!
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default StudentSettings;
