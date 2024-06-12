import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { getDatabase, ref as setref, onValue, set } from "firebase/database";

const Msg = () => {
  const param = useParams();
  const database = getDatabase();
  const testRef = useRef("");
  const ref = useRef(null);
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const db = getDatabase();
  const [messages, setMessages] = useState([]);
  const arraymessage = [];
  const [user, setUser] = useState([]);

  const scrollToLastFruit = () => {
    setTimeout(() => {
      const lastChildElement = ref.current?.lastElementChild;
      lastChildElement?.scrollIntoView();
    }, 300);
  };
  function dropmsg(e) {
    e.preventDefault();
    if (msg.trim().length === 0) {
      return; 
    }
    var date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    var strTime = hours + ":" + minutes + " " + ampm;

    set(setref(db, "msg/" + Date.now()), {
      sender: localStorage.getItem("uid"),
      receiver: param.uid,
      message: msg,
      time: strTime,
    });
    setMsg("");
  }
  useEffect(() => {
    testRef.current.focus();
    scrollToLastFruit();

    const reference = setref(database, "msg/");
    onValue(reference, (snapshot) => {
      const data = snapshot.val();
      if (data === null) {
        setMessages([]);
      } else {
        setMessages(data);
      }
    });

    const userref = setref(database, "user/" + param.uid + "");
    onValue(userref, (snapshot) => {
      const udata = snapshot.val();
      setUser(udata);
    });
  }, [msg]);

  for (const user of Object.keys(messages)) {
    const us = messages[user];
    if (
      (us.sender === localStorage.getItem("uid") ||
        us.receiver === localStorage.getItem("uid")) &&
      (us.receiver === param.uid || us.sender === param.uid)
    ) {
      arraymessage.push(us);
    }
  }

  return (
    <div className="google-font">
      <div className="fixed-top  p-4 bg-primary shadow">
        <div className="nav nav-pills justify-content-between ">
          <div className="nav-item fs-5 fw-bold text-light">
            <img
              alt=""
              onClick={() => navigate("/Home")}
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAzElEQVR4nO2ZMQ7CMAxFfcN2qLpwoArEKRG3KNJDETVsQLvEtv6TMjXD/44dpbaZELkARuC+rdEyAUzAyocHcLKk4vOY+CI+vglg/iHeaXsGSyreuVli8XEMHBS/hkihPwo2bhEj8Z1Q5HuhyPcCuOy8JkNdlVeJ7wHJI78cEN+eE7NFgFck90Y+hvgqBhYyp1D6InZkIgrAuUI6TWl/HR2ZiIJOIgo6iSikbi2WaO6WaK+XGHCUGDGVGPKVGLM6Lc9bsW5reH8QwrrwBIxxZMquetRnAAAAAElFTkSuQmCC"
              style={{ width: 23, height: 24, cursor: "pointer" }}
            />
            &nbsp; &nbsp;
            <span style={{ fontSize: "18px" }}>
              <span
                style={{ width: "40px", fontSize: "17px" }}
                className="btn btn-light rounded-circle"
              >
                {param.username[0]}
              </span>{" "}
              &nbsp;
              <span style={{ marginTop: "0px", position: "absolute" }}>
                {param.username}
              </span>{" "}
              <span
                style={{
                  marginTop: "22px",
                  position: "absolute",
                  fontSize: "12px",
                }}
              >
                {user.status}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: `100px`, marginBottom: `65px` }}>
        <div ref={ref}>
          {arraymessage?.map((msg) => {
            if (param.uid === msg.sender) {
              return (
                <div className="d-flex flex-row justify-content-start">
                  <div>
                    <p
                      className="p-2 ms-2 mb-1 rounded fs-8"
                      style={{ background: "#D6D6D6", marginRight: "10px" }}
                    >
                      {msg.message} &nbsp;
                      <span style={{ fontSize: "11px" }}>{msg.time}</span>
                    </p>
                  </div>
                </div>
              );
            } else {
              return (
                <div className="d-flex flex-row justify-content-end">
                  <div>
                    <p
                      className="fs-8 p-2 ms-3 mb-1 rounded bg-primary"
                      style={{ marginRight: "10px", color: "white" }}
                    >
                      {msg.message} &nbsp;
                      <span style={{ fontSize: "11px" }}>{msg.time}</span>
                    </p>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>

      <form
        className="d-flex fixed-bottom p-2"
        style={{ backgroundColor: "white" }}
      >
        <input
          value={msg}
          ref={testRef}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              dropmsg(e);
            }
          }}
          onClick={scrollToLastFruit}
          style={{ padding: "12px 20px" }}
          type="text"
          autoFocus
          className="form-control border border-2 border-primary ms-1 me-1 rounded-pill shadow"
          placeholder="Message"
        />
        <span className="">
          <img
            onClick={dropmsg}
            alt=""
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAACK0lEQVR4nO2aP49NURDAR0Ts7p25z9snEkFNgkSlUliR8AW2tUvxSPbOubuLhELiCyh8ghUFjU6jklCisYmGQiuiomHvHCPnyXtvSSQU797rzfyS+QDnd+acOX8GwHEcx3Ecx3Gcf2F2TQ9QkItUyPIs60GwBBWyTEG+Uog6CJYKQ3wwV+oJmHao1MMUZGs0+N8COT7JiuoMTCvIcvNPg/9FRJCXWMoiLOpOmCYwxDt/I2CcEfIOC7kMSzoDFgXQKOQjcbydr+k82BQQh0vjC4Z4d2ZdD4FFATTOiC0M8X62qkfBpoA4FPEdOT7Oiuos2BQQty+PV1TKhVZXDpyggO2Vg4KUrawcWIOAUbB8SJWjU+oeMCkgjDLic6oc6f5hUgCNM+JbqhxY6JEGBcitxgSMRUTi+Cgv9GTtArIruo9YnqXy1biIn/E05+o8gO6oVUTvuhIGPZV265SWFOTNYGYaEyGbgxLa113QFN2+drKyOk1BrhLHh8jytu5MQZb3OQsD625oA90khasFYrlWrxTZxHXdC22k29dOXlbnkOXFZLMh3oM2kwU9NlEBQT5Bm8lW9LhJAd3hEkiXn4kKiBt2N0GW17SivfoHWxopgz2rB6EsHYWDPDd7FEbrlyH063D0BxGqL9VtPomh1UdRtPksLlY/RsTm1xja/RwVm9/jOH0NEnLDdIsMWW+SSlCQJbNtckPmVnX/oF+Q5dJ/u6M7juM4juM4DpjlB2uOfVJ2r4KoAAAAAElFTkSuQmCC"
            style={{ width: 50, height: 50, cursor: "pointer" }}
          />
        </span>
      </form>
    </div>
  );
};

export default Msg;
