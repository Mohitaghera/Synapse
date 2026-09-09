import React, { useEffect, useState } from "react";
import "../context/Firebase";
import "../style.css";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { getDatabase, ref, update } from "firebase/database";

const Login = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loader, setLoader] = useState(false);
  const [error, setError] = useState("");
  const [emailValid, setEmailValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [formValid, setFormValid] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  useEffect(() => {
    setFormValid(emailValid && passwordValid);
  }, [emailValid, passwordValid]);

  const userId = localStorage.getItem("uid");

  useEffect(() => {
    if (localStorage.getItem("status") === "1") {
      navigate("/Home");

      const handleLoad = () => {
        if (userId) {
          const db = getDatabase();
          update(ref(db, "user/" + userId), {
            status: "online",
          });
        }
      };
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, [navigate, userId]);

  const validateEmail = (val) => {
    const re = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
    setEmailValid(re.test(val));
  };

  const validatePassword = (val) => {
    setPasswordValid(val.length >= 8);
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    validateEmail(val);
    setEmailTouched(true);
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    validatePassword(val);
    setPasswordTouched(true);
  };

  const signinUser = async (e) => {
    e.preventDefault();
    if (!formValid) return;
    setLoader(true);
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user.uid;
      localStorage.setItem("status", "1");
      localStorage.setItem("uid", user);
      setLoader(false);
      navigate("/Home");
    } catch (err) {
      setError(err.message || "Incorrect email or password. Please try again.");
      setLoader(false);
      setTimeout(() => {
        setError("");
      }, 4000);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-blob-1"></div>
      <div className="auth-blob-2"></div>

      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <svg viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your Synapse account</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="auth-alert-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={signinUser} noValidate>
          {/* Email */}
          <div className="auth-form-group">
            <label className="auth-label" htmlFor="emailInput">
              Email Address
            </label>
            <div className="auth-input-wrapper">
              <div className="auth-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <input
                id="emailInput"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => setEmailTouched(true)}
                className={`auth-input ${emailTouched && !emailValid ? "is-invalid" : ""}`}
                placeholder="name@example.com"
                required
              />
            </div>
            {emailTouched && !emailValid && (
              <div className="auth-error-hint">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Please enter a valid email address.
              </div>
            )}
          </div>

          {/* Password */}
          <div className="auth-form-group">
            <label className="auth-label" htmlFor="passwordInput">
              Password
            </label>
            <div className="auth-input-wrapper">
              <div className="auth-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <input
                id="passwordInput"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => setPasswordTouched(true)}
                className={`auth-input ${passwordTouched && !passwordValid ? "is-invalid" : ""}`}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="auth-toggle-pwd"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            {passwordTouched && !passwordValid && (
              <div className="auth-error-hint">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Password must be at least 8 characters.
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="auth-btn-primary"
            disabled={!formValid || loader}
          >
            {loader ? (
              <>
                <div className="auth-spinner"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>

          <div className="auth-divider"></div>

          <p className="auth-footer-text">
            Don't have an account?
            <Link to="/Register" className="auth-link">
              Sign up
            </Link>
          </p>
        </form>

        {/* GitHub Link */}
        <div className="auth-github-footer">
          <a
            href="https://github.com/Mohitaghera"
            target="_blank"
            rel="noopener noreferrer"
            className="auth-github-link"
          >
            <svg viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span>Mohitaghera</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
