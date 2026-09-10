import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDatabase, ref as setref, onValue, set, update } from "firebase/database";
import { usePresence } from "../hooks/usePresence";
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
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const currentUid = localStorage.getItem("uid");
  usePresence(currentUid);

  const recipientName = param.username
    ? decodeURIComponent(param.username)
    : "User";

  const chatContainerRef = useRef(null);
  const unreadDividerRef = useRef(null);
  const isInitialLoad = useRef(true);
  const [firstUnreadMsgId, setFirstUnreadMsgId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  useEffect(() => {
    isInitialLoad.current = true;
    setFirstUnreadMsgId(null);
    setUnreadCount(0);
    setShowScrollBottomBtn(false);
  }, [param.uid]);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight + 1000,
            behavior: behavior,
          });
        } else {
          messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
        }
      }, 40);
    });
  }, []);

  const markMessagesAsSeen = useCallback((allMsgs) => {
    const msgsToEvaluate = allMsgs || messages;
    if (!msgsToEvaluate || typeof msgsToEvaluate !== "object") return;
    const currentUid = localStorage.getItem("uid");

    Object.keys(msgsToEvaluate).forEach((msgId) => {
      const item = msgsToEvaluate[msgId];
      if (
        item &&
        item.sender === param.uid &&
        item.receiver === currentUid &&
        item.seen !== true
      ) {
        update(setref(database, "msg/" + msgId), { seen: true });
      }
    });
  }, [database, messages, param.uid]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, clientHeight, scrollHeight } = chatContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < 120) {
      markMessagesAsSeen();
      setShowScrollBottomBtn(false);
    } else if (distanceFromBottom > 220) {
      setShowScrollBottomBtn(true);
    }
  };

  function dropmsg(e) {
    if (e) e.preventDefault();
    if (msg.trim().length === 0 || !isAuthorized) return;

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
    setFirstUnreadMsgId(null);
    setUnreadCount(0);
    setShowScrollBottomBtn(false);

    // Scroll down immediately and after DOM renders
    scrollToBottom("smooth");
    setTimeout(() => {
      scrollToBottom("smooth");
      markMessagesAsSeen();
    }, 120);
    setTimeout(() => {
      scrollToBottom("smooth");
    }, 280);
  }

  useEffect(() => {
    testRef.current?.focus();

    // Check contact authorization: param.uid must exist in currentUid's contacts
    const contactRef = setref(database, `contacts/${currentUid}/${param.uid}`);
    const unsubscribeContact = onValue(contactRef, (snapshot) => {
      const exists = snapshot.exists() && snapshot.val() === true;
      setIsAuthorized(exists);
      setAuthChecked(true);
    });

    const reference = setref(database, "msg/");
    const unsubscribeMsg = onValue(reference, (snapshot) => {
      const data = snapshot.val();
      setMessages(data || {});

      if (isInitialLoad.current && data && typeof data === "object") {
        const unreadItems = [];
        Object.keys(data).forEach((msgId) => {
          const item = data[msgId];
          if (
            item &&
            item.sender === param.uid &&
            item.receiver === currentUid &&
            item.seen !== true
          ) {
            unreadItems.push({ id: msgId, ...item });
          }
        });

        if (unreadItems.length > 0) {
          unreadItems.sort((a, b) => Number(a.id) - Number(b.id));
          const firstUnread = unreadItems[0];
          setFirstUnreadMsgId(firstUnread.id);
          setUnreadCount(unreadItems.length);

          setTimeout(() => {
            if (unreadDividerRef.current) {
              unreadDividerRef.current.scrollIntoView({ behavior: "auto", block: "center" });
            } else {
              scrollToBottom("auto");
            }
          }, 100);

          setTimeout(() => {
            setFirstUnreadMsgId(null);
            setUnreadCount(0);
          }, 3200);
        } else {
          scrollToBottom("auto");
          markMessagesAsSeen(data);
        }

        isInitialLoad.current = false;
      } else {
        if (chatContainerRef.current) {
          const { scrollTop, clientHeight, scrollHeight } = chatContainerRef.current;
          if (scrollHeight - scrollTop - clientHeight < 120) {
            markMessagesAsSeen(data);
          }
        }
      }
    });

    const userref = setref(database, "user/" + param.uid);
    const unsubscribeUser = onValue(userref, (snapshot) => {
      const udata = snapshot.val();
      setUser(udata || {});
    });

    return () => {
      if (typeof unsubscribeContact === "function") unsubscribeContact();
      if (typeof unsubscribeMsg === "function") unsubscribeMsg();
      if (typeof unsubscribeUser === "function") unsubscribeUser();
    };
  }, [database, param.uid, currentUid, markMessagesAsSeen]);

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
        arraymessage.push({ ...us, id: key });
      }
    });
  }

  const prevMsgCount = useRef(0);
  useEffect(() => {
    if (arraymessage.length > prevMsgCount.current) {
      const lastMsg = arraymessage[arraymessage.length - 1];
      const currentUid = localStorage.getItem("uid");
      if (lastMsg && lastMsg.sender === currentUid) {
        scrollToBottom("smooth");
        setTimeout(() => scrollToBottom("smooth"), 100);
      }
    }
    prevMsgCount.current = arraymessage.length;
  }, [arraymessage, scrollToBottom]);

  // If authorization check completed and user is not authorized
  if (authChecked && !isAuthorized) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-dark)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
        <div className="auth-blob-1" style={{ opacity: 0.4 }}></div>
        <div className="auth-blob-2" style={{ opacity: 0.4 }}></div>
        <div className="empty-state-card" style={{ maxWidth: "450px", width: "100%", padding: "2.5rem 1.5rem" }}>
          <div className="empty-state-icon" style={{ background: "rgba(239, 68, 68, 0.12)", color: "#ef4444" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div className="empty-state-title">Access Restricted</div>
          <p style={{ margin: "0 0 1.5rem 0", fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            You cannot message <strong style={{ color: "#ffffff" }}>{recipientName}</strong> because they are not in your contacts. Add them using their email address to start chatting.
          </p>
          <button
            type="button"
            className="auth-btn-primary"
            onClick={() => navigate("/Home")}
            style={{ width: "100%" }}
          >
            Return to Contacts
          </button>
        </div>
      </div>
    );
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
      <main className="msg-container" ref={chatContainerRef} onScroll={handleScroll}>
        <div className="chat-history-container">
          <div style={{ marginTop: "auto" }} />
          {arraymessage.length > 0 ? (
            arraymessage.map((m, idx) => {
              const isSentByMe = m.sender === localStorage.getItem("uid");
              const isFirstUnread = m.id === firstUnreadMsgId;

              return (
                <React.Fragment key={m.id || idx}>
                  {isFirstUnread && (
                    <div ref={unreadDividerRef} className="unread-messages-divider">
                      <span className="unread-divider-badge">
                        {unreadCount} Unread Message{unreadCount > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                  <div className={`chat-bubble-row ${isSentByMe ? "sent" : "received"}`}>
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
                </React.Fragment>
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
          <div ref={messagesEndRef} className="chat-bottom-spacer" />
        </div>
      </main>

      {/* Floating Scroll to Bottom Button (WhatsApp Style) */}
      {showScrollBottomBtn && (
        <button
          type="button"
          className="scroll-bottom-btn"
          onClick={() => {
            scrollToBottom("smooth");
            markMessagesAsSeen();
            setShowScrollBottomBtn(false);
          }}
          title="Scroll to bottom"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </button>
      )}

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
