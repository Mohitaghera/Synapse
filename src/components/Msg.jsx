import React, { useRef, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDatabase, ref as setref, onValue, set, update } from "firebase/database";
import "../style.css";

const Msg = () => {
  const param = useParams();
  const database = getDatabase();
  const testRef = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState({});

  const recipientName = param.username
    ? decodeURIComponent(param.username)
    : "User";

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  function dropmsg(e) {
    if (e) e.preventDefault();
    if (msg.trim().length === 0) return;

    const date = new Date();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    const strTime = `${hours}:${minutes} ${ampm}`;

    set(setref(database, "msg/" + Date.now()), {
      sender: localStorage.getItem("uid"),
      receiver: param.uid,
      message: msg,
      time: strTime,
      seen: false,
    });
    setMsg("");
    scrollToBottom();
  }

  useEffect(() => {
    testRef.current?.focus();

    const currentUid = localStorage.getItem("uid");
    const reference = setref(database, "msg/");
    const unsubscribeMsg = onValue(reference, (snapshot) => {
      const data = snapshot.val();
      setMessages(data || {});
      scrollToBottom();

      // Automatically mark received messages from recipient as seen
      if (data && typeof data === "object") {
        Object.keys(data).forEach((msgId) => {
          const item = data[msgId];
          if (
            item &&
            item.sender === param.uid &&
            item.receiver === currentUid &&
            item.seen !== true
          ) {
            update(setref(database, "msg/" + msgId), { seen: true });
          }
        });
      }
    });

    const userref = setref(database, "user/" + param.uid);
    const unsubscribeUser = onValue(userref, (snapshot) => {
      const udata = snapshot.val();
      setUser(udata || {});
    });

    return () => {
      if (typeof unsubscribeMsg === "function") unsubscribeMsg();
      if (typeof unsubscribeUser === "function") unsubscribeUser();
    };
  }, [database, param.uid]);

  const arraymessage = [];
  if (messages && typeof messages === "object") {
    const currentUid = localStorage.getItem("uid");
    Object.keys(messages).forEach((key) => {
      const us = messages[key];
      if (
        us &&
        ((us.sender === currentUid || us.receiver === currentUid) &&
          (us.receiver === param.uid || us.sender === param.uid))
      ) {
        arraymessage.push(us);
      }
    });
  }

  const isOnline = user?.status === "online";
  const recipientInitial = recipientName[0] ? recipientName[0].toUpperCase() : "?";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-dark)", position: "relative", overflow: "hidden", maxWidth: "100vw" }}>
      {/* Background Orbs */}
      <div className="auth-blob-1" style={{ opacity: 0.4 }}></div>
      <div className="auth-blob-2" style={{ opacity: 0.4 }}></div>

      {/* Glassmorphic Header */}
      <header className="app-header">
        <div className="app-nav">
          <div className="d-flex align-items-center gap-3" style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
            <button
              type="button"
              className="icon-btn"
              onClick={() => navigate("/Home")}
              title="Back to contacts"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <div className="msg-header-user">
              <div className="msg-header-avatar">
                {recipientInitial}
                <span className={`status-indicator-dot ${isOnline ? "online" : "offline"}`}></span>
              </div>
              <div className="msg-header-info">
                <span className="msg-header-name">{recipientName}</span>
                <span className={`msg-header-status ${isOnline ? "is-online" : ""}`}>
                  {isOnline ? "Active now" : user?.status || "Offline"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Container */}
      <main className="msg-container">
        <div className="chat-history-container">
          {arraymessage.length > 0 ? (
            arraymessage.map((m, idx) => {
              const isSentByMe = m.sender === localStorage.getItem("uid");

              return (
                <div
                  key={idx}
                  className={`chat-bubble-row ${isSentByMe ? "sent" : "received"}`}
                >
                  <div className="chat-bubble">
                    <span className="chat-msg-text">{m.message}</span>
                    <span className="chat-bubble-meta">
                      <span>{m.time}</span>
                      {isSentByMe && (
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={m.seen ? "tick-seen" : "tick-unseen"}
                          title={m.seen ? "Read" : "Delivered"}
                        >
                          <path d="M18 6L7 17l-5-5"></path>
                          <path d="M22 6l-8.5 8.5"></path>
                        </svg>
                      )}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state-card" style={{ margin: "auto 0" }}>
              <div className="empty-state-icon">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div className="empty-state-title">No messages yet</div>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)" }}>
                Start a conversation with <strong style={{ color: "#ffffff" }}>{recipientName}</strong>
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Bottom Floating Chat Dock */}
      <div className="chat-dock">
        <form className="chat-dock-inner" onSubmit={dropmsg}>
          <input
            ref={testRef}
            type="text"
            className="chat-dock-input"
            placeholder={`Message ${recipientName}...`}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                dropmsg(e);
              }
            }}
            autoFocus
          />
          <button
            type="submit"
            className="chat-dock-send-btn"
            disabled={!msg.trim()}
            title="Send message"
          >
            <svg viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Msg;
