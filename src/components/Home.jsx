import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getDatabase, ref, onValue, update } from "firebase/database";
import "../App.css";

const Home = () => {
  const navigate = useNavigate();
  const database = getDatabase();
  const [users, setUsers] = useState([]);
  const userId = localStorage.getItem("uid");
  const [spin, setSpin] = useState(false);
  const u = [];
  var username = "";
  var email = "";

  const logout = () => {
    localStorage.removeItem("uid");
    localStorage.setItem("status", "0");

    //set status as last seen
    const db = getDatabase();

    var date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    var lastseen =
      "last seen " +
      day +
      "/" +
      month +
      "/" +
      (date.getFullYear() % 100) +
      " at " +
      hours +
      ":" +
      minutes +
      " " +
      ampm;

    update(ref(db, "user/" + userId + ""), {
      status: lastseen,
    });

    navigate("/");
  };
  const logout1 = () => {
    if (window.confirm("Are you sure to logout?")) {
      localStorage.removeItem("uid");
      localStorage.setItem("status", "0");

      //set status as last seen
      const db = getDatabase();
      var date = new Date();
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var day = date.getDate();
      var month = date.getMonth() + 1;
      var ampm = hours >= 12 ? "pm" : "am";
      hours = hours % 12;
      hours = hours ? hours : 12;
      minutes = minutes < 10 ? "0" + minutes : minutes;
      var lastseen =
        "last seen " +
        day +
        "/" +
        month +
        "/" +
        (date.getFullYear() % 100) +
        " at " +
        hours +
        ":" +
        minutes +
        " " +
        ampm;

      update(ref(db, "user/" + userId + ""), {
        status: lastseen,
      });

      navigate("/");
    }
  };

  useEffect(() => {
    setSpin(true);
    if (localStorage.getItem("status") === "0") {
      navigate("/");
    }
    const db = getDatabase();
    update(ref(db, "user/" + userId + ""), {
      status: "online",
    });

    const reference = ref(database, "user/");
    onValue(reference, (snapshot) => {
      const data = snapshot.val();
      setUsers(data);
      setSpin(false);
    });
  }, []);

  for (const user of Object.keys(users)) {
    const us = users[user];
    if (us.uid !== localStorage.getItem("uid")) {
      u.push(us);
    }
    if (us.uid === userId) {
      username = us.username;
      email = us.email;
    }
  }

  //code for online offline
  window.addEventListener("beforeunload", (event) => {
    event.preventDefault();
    const db = getDatabase();

    var date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    var lastseen =
      "last seen " +
      day +
      "/" +
      month +
      "/" +
      (date.getFullYear() % 100) +
      " at " +
      hours +
      ":" +
      minutes +
      " " +
      ampm;

    update(ref(db, "user/" + userId + ""), {
      status: lastseen,
    });
  });

  return (
    <div className="google-font">
      {spin && (
        <div
          className="spinner-border z-3 position-absolute"
          style={{
            marginTop: "50%",
            marginLeft: "45%",
            height: "50px",
            width: "50px",
          }}
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      )}
      <div>
        <div className="fixed-top  p-4 bg-primary shadow">
          <div className="nav nav-pills justify-content-between text-light">
            <div className="nav-item fs-5 fw-bold  align-center">
              <img
                onClick={logout1}
                alt=""
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/OOjs_UI_icon_logOut-ltr-invert.svg/1024px-OOjs_UI_icon_logOut-ltr-invert.svg.png"
                height={22}
                style={{ cursor: "pointer" }}
              />
            </div>
            <div className="nav-item fs-4 fw-bold align-center">Synapse</div>
            <div className="nav-item ">
              <button
                type="button"
                className="btn btn-light rounded-circle"
                data-bs-toggle="modal"
                data-bs-target="#exampleModal"
              >
                {spin ? "O" : username[0]}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "100px" }}>
        <ul className="list-group borderless">
          {u?.map((val) => {
            return (
              <Link
                to={`/Msg/${val.uid}/${val.username}`}
                className="text-decoration-none "
              >
                <li className="list-group-flush p-2 ms-2">
                  {" "}
                  <button
                    type="button"
                    style={{ width: "40px", fontSize: "17px" }}
                    className="btn btn-primary rounded-circle position-relative"
                  >
                    {val?.username[0]}
                    {val?.status === "online" ? (
                      <span
                        className="position-absolute bottom-0 start-75 bg-success border border-3 border-light rounded-circle"
                        style={{ padding: "5px", marginLeft: "3px" }}
                      ></span>
                    ) : (
                      <></>
                    )}
                  </button>
                  &nbsp; <span style={{ color: "black" }}>{val?.username} </span>
                </li>
              </Link>
            );
          })}
        </ul>
      </div>
      <div
        className="modal fade"
        id="exampleModal"
        tabindex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
                Account
              </h5>
            </div>
            <div className="modal-body">
              <div className="d-flex">
                <div
                  className="btn btn-primary rounded-circle"
                  style={{ width: "50px", fontSize: "25px" }}
                >
                  {username[0]}
                </div>
                <div className="ms-2">
                  <div style={{ fontWeight: "700", fontSize: "16px" }}>
                    {username}
                  </div>
                  <div style={{ fontWeight: "400", fontSize: "15px" }}>
                    {email}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={logout}
                data-bs-dismiss="modal"
                className="btn btn-danger"
              >
                Logout
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
