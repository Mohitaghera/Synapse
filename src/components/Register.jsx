import React, { useState, useEffect } from "react";
import "../context/Firebase";
import '../style.css'
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getDatabase();

  const [email, setEmail] = useState();
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loader, setLoader] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [usernameValid, setUsernameValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [formValid, setFormValid] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);

  useEffect(() => {
    setFormValid(emailValid && passwordValid);
  }, [emailValid, passwordValid]);

  useEffect(() => {
    if (localStorage.getItem("status") === "1") {
      navigate("/Home");
    }
  });

  const validateEmail = (email) => {
    const re = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
    setEmailValid(re.test(email));
  };
  const validateUsername = (username) => {
    const re = /^[A-Za-z]/;
    setUsernameValid(re.test(username));
  };

  const validatePassword = (password) => {
    setPasswordValid(password.length >= 8);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    validateEmail(e.target.value);
    setEmailTouched(true);
  };
  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    validateUsername(e.target.value);
    setUsernameTouched(true);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    validatePassword(e.target.value);
    setPasswordTouched(true);
  };

  const putuser = (user) => {
    set(ref(db, "user/" + user.uid), {
      uid: user.uid,
      username: username,
      email: email,
      status: "offline",
    });
    navigate("/");
  };
  const signupUser = async (e) => {
    e.preventDefault();
    setLoader(true);
    await createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        setLoader(false);
        putuser(userCredential.user);
      })
      .catch((error) => {
        const errorMessage = error.message;
        setError(errorMessage);
      });
    setEmail("");
    setUsername("");
    setPassword("");
  };

  return (
    <div>
      <div className="container mt-5 p-5">
        <h1>Hello !</h1>
        <br></br>
        <form onSubmit={signupUser}>
          <div className="mb-3">
            <label for="exampleInputPassword1" className="form-label">
              Username
            </label>
            <input
              value={username}
              onChange={handleUsernameChange}
              onBlur={() => setUsernameTouched(true)}
              className={`form-control ${
                usernameTouched && !usernameValid ? "is-invalid" : ""
              }`}
              type="text"
              id="exampleInputusername"
              placeholder="Enter username"
            />
            {usernameTouched && !usernameValid && (
              <div className="invalid-feedback">
                Please enter a valid username.{" "}
              </div>
            )}
          </div>
          <div className="mb-3">
            <label for="exampleInputEmail1" className="form-label">
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
              placeholder="Enter email"
            />
            {emailTouched && !emailValid && (
              <div className="invalid-feedback">
                Please enter a valid email.
              </div>
            )}
          </div>
          <div className="mb-3">
            <label for="exampleInputPassword1" className="form-label">
              Password
            </label>

            <input
              value={password}
              onChange={handlePasswordChange}
              onBlur={() => setPasswordTouched(true)}
              className={`form-control ${
                passwordTouched && !passwordValid ? "is-invalid" : ""
              }`}
              type="password"
              id="exampleInputPassword1"
              placeholder="Enter password"
            />
            {passwordTouched && !passwordValid && (
              <div className="invalid-feedback">
                Password must be at least 8 characters long.
              </div>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-dark w-100"
            disabled={!formValid || loader}
          >
            <span>Sign up</span>
          </button>
          <center style={{ color: `red` }}>{error}</center>
          <hr></hr>
          Already have an account ?{" "}
          <Link to="/" className="text-decoration-none">
            Login
          </Link>
        </form>
      </div>
      <div className="fixed-bottom mb-5">
        <center>
          <a href="https://github.com/Mohitaghera">
            <img
              style={{ width: "40px" }}
              alt=""
              src="https://upload.wikimedia.org/wikipedia/commons/c/c2/GitHub_Invertocat_Logo.svg"
            />
          </a>
        </center>
      </div>
    </div>
  );
};

export default Register;
