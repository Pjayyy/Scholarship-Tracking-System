import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { FiMoon, FiSun } from "react-icons/fi";
import { FaUniversity } from "react-icons/fa";
import API from "../../services/api";
import { STAFF_LOGIN_PATH } from "../../app/auth/authRoute";
import { toast } from "react-toastify";

function Login({ setUser, setToken, variant = "student" }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [rememberMe, setRememberMe] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [errors, setErrors] = useState({});

  const [isDarkMode, setIsDarkMode] =
    useState(true);

  useEffect(() => {
    const savedEmail =
      localStorage.getItem(
        "rememberedEmail"
      );

    const savedTheme =
      localStorage.getItem("authTheme");

    if (savedEmail) {
      setFormData((prev) => ({
        ...prev,
        username: savedEmail,
      }));

      setRememberMe(true);
    }

    if (savedTheme === "light") {
      setIsDarkMode(false);

      document.documentElement.dataset.theme =
        "light";
    } else {
      document.documentElement.dataset.theme =
        "dark";
    }
  }, []);

  const copy = useMemo(() => {
    if (variant === "admin") {
      return {
        shellTitle: "Scholarship System — Staff",
        kicker: "Administrator sign-in",
        title: "Staff access",
        subtitle:
          "Use your staff or institutional administrator account.",
        submitIdle: "Sign in to admin",
        submitBusy: "Signing in...",
      };
    }
    return {
      shellTitle: "Scholarship Portal",
      kicker: "Student sign-in",
      title: "Welcome back",
      subtitle:
        "Use your student email and password to open your portal.",
      submitIdle: "Enter student portal",
      submitBusy: "Signing in...",
    };
  }, [variant]);

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const toggleTheme = () => {
    const nextTheme = !isDarkMode;

    setIsDarkMode(nextTheme);

    document.documentElement.dataset.theme =
      nextTheme ? "dark" : "light";

    localStorage.setItem(
      "authTheme",
      nextTheme ? "dark" : "light"
    );
  };

  const validate = () => {
    const validationErrors = {};

    if (!formData.username.trim()) {
      validationErrors.username =
        "Email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.username
      )
    ) {
      validationErrors.username =
        "Enter a valid email address.";
    }

    if (!formData.password.trim()) {
      validationErrors.password =
        "Password is required.";
    }

    setErrors(validationErrors);

    return (
      Object.keys(validationErrors).length === 0
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      toast.error(
        "Please fix the highlighted fields."
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const response = await API.post(
        "/login",
        {
          email: formData.username,
          password: formData.password,
        }
      );

      if (
        response.data.status === "success"
      ) {
        const user = response.data.user;

        if (
          variant === "student" &&
          user.role !== "student"
        ) {
          toast.error(
            `This page is for students. Staff should sign in at ${window.location.origin}${STAFF_LOGIN_PATH}.`
          );

          return;
        }

        if (
          variant === "admin" &&
          user.role !== "admin"
        ) {
          toast.error(
            "This page is for administrators only. Students should use the home page."
          );

          return;
        }

        setUser(user);

        if (response.data.token) {
          setToken(response.data.token);

          localStorage.setItem(
            "token",
            response.data.token
          );
        }

        localStorage.setItem(
          "user",
          JSON.stringify(user)
        );

        if (rememberMe) {
          localStorage.setItem(
            "rememberedEmail",
            formData.username
          );
        } else {
          localStorage.removeItem(
            "rememberedEmail"
          );
        }

        toast.success(
          "Welcome back! Redirecting to your dashboard..."
        );
      } else {
        toast.error(
          response.data.message ||
            "Login failed, please try again."
        );
      }
    } catch (error) {
      console.log(
        "LOGIN ERROR:",
        error
      );

      if (
        error.response?.status === 401
      ) {
        toast.error(
          "Invalid credentials. Please check your email and password."
        );
      } else if (
        error.response?.status === 404
      ) {
        toast.error(
          "Login endpoint not found. Check backend configuration."
        );
      } else {
        toast.error(
          error.response?.data?.message ||
            "Server error. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="auth-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <header className="auth-shell-header">
        <div className="auth-shell-brand">
          <span className="auth-shell-mark">
            <FaUniversity size={18} />
          </span>
          <span className="auth-shell-title">
            {copy.shellTitle}
          </span>
        </div>

        <button
          type="button"
          className="pill btn-ghost auth-theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${
            isDarkMode ? "light" : "dark"
          } theme`}
        >
          {isDarkMode ? (
            <FiSun size={18} />
          ) : (
            <FiMoon size={18} />
          )}
          <span className="auth-theme-toggle__label">
            {isDarkMode ? "Light" : "Dark"}
          </span>
        </button>
      </header>

      <div className="auth-grid">
        <motion.div
          className="auth-card-wrapper"
          initial={{ opacity: 0, x: 36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.65,
            ease: "easeOut",
            delay: 0.12,
          }}
        >
          <div className="auth-card auth-card--elevated">
            <p className="auth-card-kicker">
              {copy.kicker}
            </p>

            <div className="card-title auth-card-title">
              {copy.title}
            </div>

            <p className="card-subtitle auth-card-subtitle">
              {copy.subtitle}
            </p>

            <form
              onSubmit={handleSubmit}
              noValidate
            >
              <div
                className={`input-group ${
                  errors.username
                    ? "has-error"
                    : ""
                }`}
              >
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.username}
                  placeholder=" "
                  autoComplete="email"
                  onChange={(e) =>
                    updateField(
                      "username",
                      e.target.value
                    )
                  }
                  aria-label="Email address"
                  aria-invalid={!!errors.username}
                />

                <label htmlFor="email">
                  Email address
                </label>

                {errors.username && (
                  <span className="field-error">
                    {errors.username}
                  </span>
                )}
              </div>

              <div
                className={`input-group ${
                  errors.password
                    ? "has-error"
                    : ""
                }`}
              >
                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={formData.password}
                  placeholder=" "
                  autoComplete="current-password"
                  onChange={(e) =>
                    updateField(
                      "password",
                      e.target.value
                    )
                  }
                  aria-label="Password"
                  aria-invalid={!!errors.password}
                />

                <label htmlFor="password">
                  Password
                </label>

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <AiFillEyeInvisible
                      size={22}
                    />
                  ) : (
                    <AiFillEye size={22} />
                  )}
                </button>

                {errors.password && (
                  <span className="field-error">
                    {errors.password}
                  </span>
                )}
              </div>

              <div className="action-row">
                <label className="checkbox-group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(
                        e.target.checked
                      )
                    }
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  className="forgot-link"
                >
                  Forgot password?
                </button>
              </div>

              <button
                className="auth-button auth-button--shine"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? copy.submitBusy
                  : copy.submitIdle}
              </button>
            </form>

            <div className="footer-note auth-footer-note">
              {variant === "admin"
                ? "Staff console"
                : "Student portal"}{" "}
              · v2.1.0 · {new Date().getFullYear()}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Login;
