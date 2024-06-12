import React, { useEffect, useState } from "react";
import "../context/Firebase";
import '../style.css'
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { getDatabase, ref, update } from "firebase/database";

const Login = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

      window.addEventListener("load", (event) => {
        event.preventDefault();
        const db = getDatabase();
        update(ref(db, "user/" + userId + ""), {
          status: "online",
        });
      });
    }
  });

  const validateEmail = (email) => {
    const re = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
    setEmailValid(re.test(email));
  };

  const validatePassword = (password) => {
    setPasswordValid(password.length >= 8);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    validateEmail(e.target.value);
    setEmailTouched(true);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    validatePassword(e.target.value);
    setPasswordTouched(true);
  };

  const signinUser = async (e) => {
    e.preventDefault();
    setLoader(true);
    await signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        setLoader(false);
        const user = userCredential.user.uid;
        localStorage.setItem("status", "1");
        localStorage.setItem("uid", user);
        navigate("/Home");
      })
      .catch((error) => {
        const errorMessage = error.message;
        setError(errorMessage);
        setTimeout(() => {
          setError("");
        }, 2000);
        setLoader(false);
      });
    setEmail("");
    setPassword("");
  };

  return (
    <div className="container mt-5 p-5">
      {error && (
        <div
          className="alert alert-danger mt-3"
          role="alert"
          style={{
            position: "fixed",
            top: "16px",
            fontSize: "14px",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          Incorrect username or password. Please try again.
        </div>
      )}
      <h1 style={{ textAlign: "center" }}>Welcome</h1>
      <br />
      <form onSubmit={signinUser}>
        <div className="mb-3">
          <label htmlFor="exampleInputEmail1" className="form-label">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            onBlur={() => setEmailTouched(true)}
            className={`form-control ${
              emailTouched && !emailValid ? "is-invalid" : ""
            }`}
            id="exampleInputEmail1"
            aria-describedby="emailHelp"
            placeholder="Enter Email"
          />
          {emailTouched && !emailValid && (
            <div className="invalid-feedback">Please enter a valid email.</div>
          )}
        </div>
        <div className="mb-3">
          <label htmlFor="exampleInputPassword1" className="form-label">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            onBlur={() => setPasswordTouched(true)}
            className={`form-control ${
              passwordTouched && !passwordValid ? "is-invalid" : ""
            }`}
            id="exampleInputPassword1"
            placeholder="Enter Password"
          />
          {passwordTouched && !passwordValid && (
            <div className="invalid-feedback">
              Password must be at least 8 characters long.
            </div>
          )}
        </div>
        <br />
        <button
          type="submit"
          className="btn btn-dark w-100"
          disabled={!formValid || loader}
        >
          <span>Login</span>
        </button>
        <hr />
        Don't have an account yet ?{" "}
        <Link to="./Register" className="text-decoration-none">
          Sign up
        </Link>
      </form>
      <div className="fixed-bottom mb-5">
        <center>
          <a href="https://github.com/Mohitaghera">
            <img
              alt=""
              style={{ width: "40px" }}
              src="https://upload.wikimedia.org/wikipedia/commons/c/c2/GitHub_Invertocat_Logo.svg"
            />
          </a>
        </center>
      </div>
    </div>
  );
};

export default Login;
