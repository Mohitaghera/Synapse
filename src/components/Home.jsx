import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getDatabase, ref, onValue, update } from "firebase/database";
import "../style.css";

const Home = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState({});
  const [allMessages, setAllMessages] = useState({});
  const userId = localStorage.getItem("uid");
  const [spin, setSpin] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  let username = "";
  let email = "";
  const contactList = [];

  const updateStatus = useCallback((statusValue) => {
    const db = getDatabase();
    if (userId) {
      update(ref(db, "user/" + userId), {
        status: statusValue,
      });
    }
  }, [userId]);

  const getFormattedLastSeen = () => {
    const date = new Date();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    return `last seen ${day}/${month}/${date.getFullYear() % 100} at ${hours}:${minutes} ${ampm}`;
  };

  const logout = () => {
    updateStatus(getFormattedLastSeen());
    localStorage.removeItem("uid");
    localStorage.setItem("status", "0");
    navigate("/");
  };

  const logoutConfirm = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      logout();
    }
  };

  useEffect(() => {
    if (localStorage.getItem("status") === "0" || !userId) {
      navigate("/");
      return;
    }

    const db = getDatabase();
    updateStatus("online");

    const reference = ref(db, "user/");
    const unsubscribeUsers = onValue(reference, (snapshot) => {
      const data = snapshot.val();
      setUsers(data || {});
      setSpin(false);
    });

    const msgRef = ref(db, "msg/");
    const unsubscribeMsg = onValue(msgRef, (snapshot) => {
      const mData = snapshot.val();
      setAllMessages(mData || {});
    });

    return () => {
      if (typeof unsubscribeUsers === "function") unsubscribeUsers();
      if (typeof unsubscribeMsg === "function") unsubscribeMsg();
    };
  }, [navigate, userId, updateStatus]);

  // Extract contact list and current user details
  if (users && typeof users === "object") {
    Object.keys(users).forEach((key) => {
      const us = users[key];
      if (us && typeof us === "object") {
        if (us.uid === userId) {
          username = us.username || "";
          email = us.email || "";
        } else if (us.uid) {
          contactList.push(us);
        }
      }
    });
  }

  const getUnreadCount = (contactUid) => {
    if (!allMessages || typeof allMessages !== "object") return 0;
    let count = 0;
    Object.keys(allMessages).forEach((key) => {
      const m = allMessages[key];
      if (
        m &&
        m.sender === contactUid &&
        m.receiver === userId &&
        m.seen !== true
      ) {
        count++;
      }
    });
    return count;
  };

  // Filter contacts by search query
  const filteredContacts = contactList.filter((contact) => {
    const name = contact.username ? contact.username.toLowerCase() : "";
    const mail = contact.email ? contact.email.toLowerCase() : "";
    const q = searchQuery.toLowerCase();
    return name.includes(q) || mail.includes(q);
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-dark)" }}>
      {/* Background Glowing Orbs */}
      <div className="auth-blob-1" style={{ opacity: 0.6 }}></div>
      <div className="auth-blob-2" style={{ opacity: 0.6 }}></div>

      {/* Top Navbar Header */}
      <header className="app-header">
        <div className="app-nav">
          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              className="icon-btn"
              onClick={logoutConfirm}
              title="Logout"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>

            <div className="app-brand">
              <div className="app-brand-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
              <span className="app-brand-text">Synapse</span>
            </div>
          </div>

          <button
            type="button"
            className="user-avatar-btn"
            data-bs-toggle="modal"
            data-bs-target="#accountModal"
            title="Profile"
          >
            {spin ? (
              <div className="auth-spinner" style={{ width: "16px", height: "16px" }}></div>
            ) : (
              username ? username[0].toUpperCase() : "U"
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="home-container">
        {/* Search Bar */}
        <div className="search-bar-wrapper">
          <div className="search-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input
            type="text"
            className="search-bar-input"
            placeholder="Search contacts by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span>Contacts ({filteredContacts.length})</span>
        </div>

        {/* Loading Spinner */}
        {spin ? (
          <div className="empty-state-card" style={{ padding: "4rem 1.5rem" }}>
            <div className="auth-spinner" style={{ width: "36px", height: "36px", margin: "0 auto 1rem auto", borderTopColor: "#6366f1" }}></div>
            <div className="empty-state-title">Loading contacts...</div>
          </div>
        ) : filteredContacts.length > 0 ? (
          <div className="contact-card-list">
            {filteredContacts.map((contact, index) => {
              const isOnline = contact.status === "online";
              const initial = contact.username ? contact.username[0].toUpperCase() : "?";
              const unreadCount = getUnreadCount(contact.uid);

              return (
                <Link
                  key={contact.uid || index}
                  to={`/Msg/${contact.uid}/${encodeURIComponent(contact.username || "User")}`}
                  className="contact-card"
                >
                  <div className="contact-info-group">
                    <div className="contact-avatar">
                      {initial}
                      <span className={`status-indicator-dot ${isOnline ? "online" : "offline"}`}></span>
                    </div>

                    <div className="contact-details">
                      <span className="contact-name">{contact.username || "Unknown User"}</span>
                      <span className={`contact-status-text ${isOnline ? "is-online" : ""}`}>
                        {isOnline ? "Active now" : contact.status || "Offline"}
                      </span>
                    </div>
                  </div>

                  <div className="contact-action-btn">
                    {unreadCount > 0 && (
                      <span className="unread-badge">{unreadCount}</span>
                    )}
                    <span>Chat</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty-state-card">
            <div className="empty-state-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </div>
            <div className="empty-state-title">No contacts found</div>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {searchQuery ? `No user matches "${searchQuery}"` : "No other registered users in Synapse yet."}
            </p>
          </div>
        )}
      </main>

      {/* Profile Modal */}
      <div
        className="modal fade custom-dark-modal"
        id="accountModal"
        tabIndex="-1"
        aria-labelledby="accountModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="accountModalLabel">
                Account Details
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="contact-avatar"
                  style={{ width: "56px", height: "56px", fontSize: "1.5rem" }}
                >
                  {username ? username[0].toUpperCase() : "U"}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#ffffff" }}>
                    {username || "Logged in User"}
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    {email || "No email available"}
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={logout}
                data-bs-dismiss="modal"
                className="btn btn-danger rounded-pill px-4"
                style={{ background: "#ef4444", border: "none", fontWeight: 600 }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
