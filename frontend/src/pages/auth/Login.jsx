import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { FaGraduationCap, FaShieldAlt, FaLock, FaUserGraduate } from "react-icons/fa";
import API from "../../services/api";
import { STAFF_LOGIN_PATH } from "../../app/auth/authRoute";
import { toast } from "react-toastify";

function Login({ setUser, setToken, variant = "student" }) {
  const aclcLogoSrc = `${process.env.PUBLIC_URL}/aclc-tacloban-logo.png`;
  const campusPhotoSrc = `${process.env.PUBLIC_URL}/aclc-campus.png`;
  const loginBackgroundSrc = `${process.env.PUBLIC_URL}/login-background.png`;
  const [logoFailed, setLogoFailed] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, username: savedEmail }));
      setRememberMe(true);
    }
    document.documentElement.dataset.theme = "light";

    const previousOverflowX = document.body.style.overflowX;
    const previousOverflowY = document.body.style.overflowY;
    document.body.style.overflowX = "hidden";
    document.body.style.overflowY = "auto";
    return () => {
      document.body.style.overflowX = previousOverflowX;
      document.body.style.overflowY = previousOverflowY;
    };
  }, []);

  const copy = useMemo(() => {
    if (variant === "admin") {
      return {
        shellTitle: "ACLC College of Tacloban Scholarship Portal",
        title: "Welcome back!",
        subtitle: "Sign in to access the staff dashboard and manage your applications.",
        submitIdle: "Sign In",
        submitBusy: "Signing in...",
      };
    }
    return {
      shellTitle: "ACLC College of Tacloban Scholarship Portal",
      title: "Welcome back!",
      subtitle: "Sign in to access your scholarship portal and manage your applications.",
      submitIdle: "Sign In",
      submitBusy: "Signing in...",
    };
  }, [variant]);

  useEffect(() => {
    document.title = copy.shellTitle;
  }, [copy.shellTitle]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const validationErrors = {};
    if (!formData.username.trim()) {
      validationErrors.username = variant === "student" ? "Student ID is required." : "Email is required.";
    } else if (variant !== "student" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.username)) {
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
        if (variant === "student" && user.role !== "student") {
          toast.error(`This page is for students. Staff should sign in at ${window.location.origin}${STAFF_LOGIN_PATH}.`);
          return;
        }
        if (variant === "admin" && user.role !== "admin") {
          toast.error("This page is for administrators only.");
          return;
        }

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
    <div className="login-page">
      {/* Minimal Modern Background */}
      <div className="login-bg login-bg-image" style={{ backgroundImage: `url(${loginBackgroundSrc})` }}>
        {/* Mesh Gradient Overlay */}
        <div className="mesh-gradient"></div>

        {/* Ambient Glow Lights */}
        <div className="ambient-glow glow-1"></div>
        <div className="ambient-glow glow-2"></div>

        {/* Smooth Wave Layers */}
        <div className="waves-container">
          <svg className="wave-layer wave-layer-1" viewBox="0 0 1440 400" preserveAspectRatio="none">
            <path d="M0,200 Q180,100 360,200 T720,200 T1080,200 T1440,200 L1440,400 L0,400 Z" fill="#3B44F6" fillOpacity="0.04"/>
          </svg>
          <svg className="wave-layer wave-layer-2" viewBox="0 0 1440 400" preserveAspectRatio="none">
            <path d="M0,250 Q240,150 480,250 T960,250 T1440,250 L1440,400 L0,400 Z" fill="#8B5CF6" fillOpacity="0.05"/>
          </svg>
          <svg className="wave-layer wave-layer-3" viewBox="0 0 1440 400" preserveAspectRatio="none">
            <path d="M0,180 C360,280 720,80 1080,180 C1200,210 1320,190 1440,180 L1440,400 L0,400 Z" fill="#4F46E5" fillOpacity="0.03"/>
          </svg>
        </div>

        {/* Subtle Dot Grid */}
        <div className="dot-grid"></div>

        {/* Minimal Floating Particles */}
        <div className="glow-particles">
          <div className="glow-particle gp-1"></div>
          <div className="glow-particle gp-2"></div>
          <div className="glow-particle gp-3"></div>
          <div className="glow-particle gp-4"></div>
          <div className="glow-particle gp-5"></div>
          <div className="glow-particle gp-6"></div>
        </div>

        {/* Curved Accent Lines */}
        <svg className="accent-lines" viewBox="0 0 1440 400" preserveAspectRatio="none">
          <path d="M0,300 Q360,200 720,300 T1440,300" fill="none" stroke="#3B44F6" strokeOpacity="0.06" strokeWidth="1"/>
          <path d="M0,320 Q400,240 800,320 T1440,320" fill="none" stroke="#8B5CF6" strokeOpacity="0.04" strokeWidth="1"/>
        </svg>

        {/* Graduation Cap Outline */}
        <div className="grad-cap-outline">
          <svg viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 8 L68 22 L40 36 L12 22 Z" stroke="#3B44F6" strokeOpacity="0.15" strokeWidth="1.5" fill="none"/>
            <path d="M40 36 L40 48" stroke="#3B44F6" strokeOpacity="0.12" strokeWidth="1.5"/>
            <rect x="28" y="48" width="24" height="5" rx="1" stroke="#8B5CF6" strokeOpacity="0.1" strokeWidth="1" fill="none"/>
            <circle cx="40" cy="10" r="3" stroke="#3B44F6" strokeOpacity="0.1" strokeWidth="1" fill="none"/>
          </svg>
        </div>

        {/* Decorative corner dot clusters */}
        <div className="corner-dots corner-dots-left" aria-hidden="true" />
        <div className="corner-dots corner-dots-right" aria-hidden="true" />

        {/* Optional campus photo (place `frontend/public/aclc-campus.png`) */}
        <div className="campus-photo" aria-hidden="true" style={{ backgroundImage: `url(${campusPhotoSrc})` }} />

        {/* Light University Silhouette */}
        <div className="uni-silhouette">
          <svg viewBox="0 0 1000 100" preserveAspectRatio="xMidYMax slice" fill="none">
            <path d="M80 100 L80 55 L120 55 L120 45 L160 45 L160 35 L180 35 L180 45 L220 45 L220 55 L280 55 L280 70 L300 70 L300 55 L340 55 L340 40 L360 40 L360 30 L390 30 L390 40 L420 40 L420 55 L480 55 L480 45 L520 45 L520 35 L560 35 L560 45 L620 45 L620 55 L680 55 L680 70 L720 70 L720 55 L780 55 L780 45 L820 45 L820 55 L880 55 L880 100 Z" fill="#3B44F6" fillOpacity="0.05"/>
            <ellipse cx="460" cy="32" rx="35" ry="18" fill="#8B5CF6" fillOpacity="0.04"/>
            <path d="M425 35 Q460 10 495 35" stroke="#4F46E5" strokeOpacity="0.06" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>

        {/* Center Negative Space Indicator (subtle) */}
        <div className="center-focus"></div>

        {/* Decorative wave corners + right-side doodles */}
        <svg className="login-corner-waves login-corner-waves-left" viewBox="0 0 520 520" fill="none" aria-hidden="true">
          <path d="M-10 420C120 330 240 330 340 375C420 410 490 480 540 540H-10V420Z" fill="#3B44F6" fillOpacity="0.11"/>
          <path d="M-10 460C115 375 245 370 342 415C425 452 490 505 540 560H-10V460Z" fill="#4F46E5" fillOpacity="0.08"/>
          <path d="M-10 495C118 415 258 408 360 458C440 497 500 545 545 590" stroke="#EF4444" strokeOpacity="0.45" strokeWidth="2.5" />
        </svg>

        <svg className="login-corner-waves login-corner-waves-right" viewBox="0 0 700 700" fill="none" aria-hidden="true">
          <path d="M700 700H210C250 580 360 470 520 420C610 392 670 335 700 280V700Z" fill="#3B44F6" fillOpacity="0.18"/>
          <path d="M700 700H300C345 600 445 520 575 485C650 465 690 420 700 385V700Z" fill="#4F46E5" fillOpacity="0.12"/>
          <path d="M690 470C610 520 520 540 445 585C385 620 330 660 300 700" stroke="#EF4444" strokeOpacity="0.55" strokeWidth="3" />
        </svg>

        <div className="login-doodles" aria-hidden="true">
          <svg className="doodle-path" viewBox="0 0 520 520" fill="none">
            <path d="M70 60C160 110 220 160 255 225C300 310 390 330 450 385" stroke="#3B44F6" strokeOpacity="0.18" strokeWidth="2" strokeDasharray="6 10" strokeLinecap="round"/>
            <circle cx="420" cy="130" r="14" stroke="#EF4444" strokeOpacity="0.55" strokeWidth="2"/>
            <circle cx="110" cy="390" r="18" stroke="#3B44F6" strokeOpacity="0.35" strokeWidth="2"/>
          </svg>

          <svg className="doodle-cap" viewBox="0 0 140 110" fill="none">
            <path d="M70 16L130 44L70 72L10 44L70 16Z" stroke="#3B44F6" strokeOpacity="0.16" strokeWidth="2" />
            <path d="M70 72V92" stroke="#3B44F6" strokeOpacity="0.14" strokeWidth="2" />
            <path d="M48 92H92" stroke="#8B5CF6" strokeOpacity="0.14" strokeWidth="2" strokeLinecap="round" />
            <path d="M130 44V64" stroke="#3B44F6" strokeOpacity="0.12" strokeWidth="2" />
            <circle cx="130" cy="68" r="5" fill="#3B44F6" fillOpacity="0.08" stroke="#3B44F6" strokeOpacity="0.12" />
          </svg>

          <svg className="doodle-cert" viewBox="0 0 140 120" fill="none">
            <rect x="26" y="18" width="88" height="70" rx="10" stroke="#3B44F6" strokeOpacity="0.14" strokeWidth="2" />
            <path d="M42 40H98" stroke="#8B5CF6" strokeOpacity="0.14" strokeWidth="2" strokeLinecap="round" />
            <path d="M42 56H88" stroke="#3B44F6" strokeOpacity="0.12" strokeWidth="2" strokeLinecap="round" />
            <path d="M42 72H78" stroke="#3B44F6" strokeOpacity="0.1" strokeWidth="2" strokeLinecap="round" />
            <circle cx="98" cy="76" r="10" stroke="#3B44F6" strokeOpacity="0.14" strokeWidth="2" />
            <path d="M94 86L98 92L102 86" stroke="#EF4444" strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Main container */}
      <div className="login-container">
        {/* Logo header */}
        <motion.div
          className="login-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="logo-wrapper">
            {!logoFailed ? (
              <img
                className="aclc-logo-img"
                src={aclcLogoSrc}
                alt="ACLC College Tacloban City logo"
                loading="eager"
                decoding="async"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <div className="logo-icon" aria-label="ACLC Scholarship Portal">
                <FaGraduationCap size={32} />
              </div>
            )}
          </div>
          <h1 className="college-name">
            <span className="college-name-aclc">ACLC</span> COLLEGE OF TACLOBAN
          </h1>
          <div className="portal-subtitle-bar" aria-hidden="true">
            <span className="subtitle-line" />
            <span className="subtitle-dot" />
            <span className="portal-subtitle">SCHOLARSHIP PORTAL</span>
            <span className="subtitle-dot" />
            <span className="subtitle-line" />
          </div>
        </motion.div>

        {/* Glassmorphism login card */}
        <motion.div
          className="login-card"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
        >
          {/* Card glow effect */}
          <div className="card-glow"></div>

          {/* Card content */}
          <div className="card-content">
            <div className="login-card-avatar" aria-hidden="true">
              <span className="login-card-avatar-inner">
                <FaUserGraduate size={18} />
              </span>
            </div>

            <div className="card-welcome">
              <h2>{copy.title}</h2>
              <p>{copy.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Student ID / Email field */}
              <div className={`form-group ${errors.username ? "has-error" : ""}`}>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <FaUserGraduate size={18} />
                  </span>
                  <input
                    id="email"
                    type={variant === "student" ? "text" : "email"}
                    value={formData.username}
                    placeholder={variant === "student" ? "Student ID" : "Email"}
                    autoComplete={variant === "student" ? "username" : "email"}
                    onChange={(e) => updateField("username", e.target.value)}
                    aria-label={variant === "student" ? "Student ID" : "Email address"}
                  />
                </div>
                {errors.username && <span className="error-message">{errors.username}</span>}
              </div>

              {/* Password field */}
              <div className={`form-group ${errors.password ? "has-error" : ""}`}>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <FaLock size={18} />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    placeholder="Password"
                    autoComplete="current-password"
                    onChange={(e) => updateField("password", e.target.value)}
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <AiFillEyeInvisible size={20} /> : <AiFillEye size={20} />}
                  </button>
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              {/* Remember me & Forgot password */}
              <div className="form-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  Remember me
                </label>
                <a
                  className="forgot-password"
                  href="#forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info("Password reset is not yet available. Please contact support.");
                  }}
                >
                  Forgot password?
                </a>
              </div>

              {/* Sign In button */}
              <motion.button
                type="submit"
                className="sign-in-btn"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <span className="btn-loading">
                    <span className="spinner"></span>
                    {copy.submitBusy}
                  </span>
                ) : (
                  <>
                    {copy.submitIdle}
                    <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </motion.button>
            </form>

            <div className="or-divider" aria-hidden="true">
              <span />
              <span className="or-text">OR</span>
              <span />
            </div>

            {/* Contact support */}
            <div className="contact-support">
              <span>Need help?</span>
              <a
                href="#contact-support"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("Please contact the scholarship office for assistance.");
                }}
              >
                Contact Support
              </a>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="login-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="login-footer-row">
            <div className="security-badge">
              <FaShieldAlt size={14} />
              <span>Secure</span>
              <span className="dot-sep">•</span>
              <span>Private</span>
              <span className="dot-sep">•</span>
              <span>Trusted</span>
            </div>
            <div className="footer-slogan">
              <span className="footer-slogan-primary">Nurturing Minds.</span>
              <span className="footer-slogan-accent">Transforming Futures.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;
