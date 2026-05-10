import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AiOutlineMail, AiOutlineLock, AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { FiSun, FiMoon } from "react-icons/fi";
import { FaUniversity } from "react-icons/fa";
import API from "./api";
import { toast } from "react-toastify";

function Login({ setUser, setToken }) {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedTheme = localStorage.getItem("authTheme");

    if (savedEmail) {
      setFormData((prev) => ({ ...prev, username: savedEmail }));
      setRememberMe(true);
    }

    if (savedTheme === "light") {
      setIsDarkMode(false);
      document.documentElement.dataset.theme = "light";
    } else {
      document.documentElement.dataset.theme = "dark";
    }
  }, []);

  const themeLabel = useMemo(() => (isDarkMode ? "Dark mode" : "Light mode"), [isDarkMode]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const toggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    document.documentElement.dataset.theme = nextTheme ? "dark" : "light";
    localStorage.setItem("authTheme", nextTheme ? "dark" : "light");
  };

  const validate = () => {
    const validationErrors = {};

    if (!formData.username.trim()) {
      validationErrors.username = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.username)) {
      validationErrors.username = "Enter a valid email address.";
    }

    if (!formData.password.trim()) {
      validationErrors.password = "Password is required.";
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await API.post("/login", {
        email: formData.username,
        password: formData.password,
      });

      if (response.data.status === "success") {
        const user = response.data.user;
        setUser(user);

        if (response.data.token) {
          setToken(response.data.token);
          localStorage.setItem("token", response.data.token);
        }

        localStorage.setItem("user", JSON.stringify(user));

        if (rememberMe) {
          localStorage.setItem("rememberedEmail", formData.username);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        toast.success("Welcome back! Redirecting to your dashboard...");
      } else {
        toast.error(response.data.message || "Login failed, please try again.");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Invalid credentials. Please check your email and password.");
      } else if (error.response?.status === 404) {
        toast.error("Login endpoint not found. Check backend configuration.");
      } else {
        toast.error(error.response?.data?.message || "Server error. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="auth-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
    >
      <div className="auth-grid">
        <motion.div
          className="auth-card-wrapper"
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        >
          <div className="auth-card">
            <div className="brand-block">
              <div className="brand-mark">
                <FaUniversity size={22} />
              </div>
              <div className="brand-copy">
                <h2>Scholarship Portal</h2>
                <p>Secure login for your academic management system</p>
              </div>
            </div>

            <div className="card-title">Welcome back</div>
            <p className="card-subtitle">
              Sign in to continue to your scholarship dashboard and access student services with confidence.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div className={`input-group ${errors.username ? "has-error" : ""}`}>
                <AiOutlineMail className="field-icon" aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.username}
                  placeholder=" "
                  autoComplete="email"
                  onChange={(e) => updateField("username", e.target.value)}
                  aria-label="Email address"
                  aria-invalid={!!errors.username}
                />
                <label htmlFor="email">Email address</label>
                {errors.username && <span className="field-error">{errors.username}</span>}
              </div>

              <div className={`input-group ${errors.password ? "has-error" : ""}`}>
                <AiOutlineLock className="field-icon" aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  placeholder=" "
                  autoComplete="current-password"
                  onChange={(e) => updateField("password", e.target.value)}
                  aria-label="Password"
                  aria-invalid={!!errors.password}
                />
                <label htmlFor="password">Password</label>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <AiFillEyeInvisible size={22} /> : <AiFillEye size={22} />}
                </button>
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              <div className="action-row">
                <label className="checkbox-group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
                <a href="#" className="forgot-link">
                  Forgot password?
                </a>
              </div>

              <button className="auth-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Login securely"}
              </button>
            </form>

            <div className="auth-meta">
              <span>{themeLabel}</span>
              <button
                type="button"
                className="password-toggle"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                style={{ padding: "0.5rem", borderRadius: "999px" }}
              >
                {isDarkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
              </button>
            </div>

            <div className="footer-note">Scholarship System · v2.1.0 · {new Date().getFullYear()}</div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Login;
