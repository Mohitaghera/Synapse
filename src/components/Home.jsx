import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getDatabase, ref, onValue, update } from "firebase/database";
import { usePresence, getFormattedLastSeen } from "../hooks/usePresence";
import "../style.css";

const Home = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState({});
  const [myContacts, setMyContacts] = useState({});
  const [allMessages, setAllMessages] = useState({});
  const userId = localStorage.getItem("uid");
  const [spin, setSpin] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Add Contact Modal State
  const [addContactEmail, setAddContactEmail] = useState("");
  const [addContactError, setAddContactError] = useState("");
  const [addContactSuccess, setAddContactSuccess] = useState("");
  const [addContactLoading, setAddContactLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  usePresence(userId);

  let username = "";
  let email = "";

  const closeModal = (modalId) => {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const closeBtn = modalElement.querySelector(".btn-close");
      if (closeBtn) closeBtn.click();
    }
  };

  const updateStatus = useCallback((statusValue) => {
    const db = getDatabase();
    if (userId) {
      update(ref(db, "user/" + userId), {
        status: statusValue,
      });
    }
  }, [userId]);

  const logout = () => {
    updateStatus(getFormattedLastSeen());
    localStorage.removeItem("uid");
    localStorage.setItem("status", "0");
    navigate("/");
  };

  useEffect(() => {
    if (localStorage.getItem("status") === "0" || !userId) {
      navigate("/");
      return;
    }

    const db = getDatabase();
    
    // Listen for users data
    const reference = ref(db, "user/");
    const unsubscribeUsers = onValue(reference, (snapshot) => {
      const data = snapshot.val();
      setUsers(data || {});
      setSpin(false);
    });

    // Listen for user's contacts
    const contactsRef = ref(db, "contacts/" + userId);
    const unsubscribeContacts = onValue(contactsRef, (snapshot) => {
      const cData = snapshot.val();
      setMyContacts(cData || {});
    });

    // Listen for all messages
    const msgRef = ref(db, "msg/");
    const unsubscribeMsg = onValue(msgRef, (snapshot) => {
      const mData = snapshot.val();
      setAllMessages(mData || {});
    });

    return () => {
      if (typeof unsubscribeUsers === "function") unsubscribeUsers();
      if (typeof unsubscribeContacts === "function") unsubscribeContacts();
      if (typeof unsubscribeMsg === "function") unsubscribeMsg();
    };
  }, [navigate, userId]);

  // Handle Add Contact Action (Mutual contact creation)
  const handleAddContact = async (e) => {
    e.preventDefault();
    setAddContactError("");
    setAddContactSuccess("");
    const inputEmail = addContactEmail.trim().toLowerCase();

    if (!inputEmail) {
      setAddContactError("Please enter a valid email address.");
      return;
    }

    if (email && inputEmail === email.toLowerCase()) {
      setAddContactError("You cannot add yourself as a contact.");
      return;
    }

    setAddContactLoading(true);

    try {
      const db = getDatabase();
      let foundUser = null;

      if (users && typeof users === "object") {
        Object.keys(users).forEach((key) => {
          const u = users[key];
          if (u && u.email && u.email.toLowerCase() === inputEmail) {
            foundUser = u;
          }
        });
      }

      if (!foundUser) {
        setAddContactError("No registered user found with this email address.");
        setAddContactLoading(false);
        return;
      }

      if (foundUser.uid === userId) {
        setAddContactError("You cannot add yourself as a contact.");
        setAddContactLoading(false);
        return;
      }

      if (myContacts && myContacts[foundUser.uid]) {
        setAddContactError(`${foundUser.username || "This user"} is already in your contacts.`);
        setAddContactLoading(false);
        return;
      }

      // Mutual Contact Creation: Update contacts for both User A and User B
      const updates = {};
      updates[`contacts/${userId}/${foundUser.uid}`] = true;
      updates[`contacts/${foundUser.uid}/${userId}`] = true;

      await update(ref(db), updates);

      const succMsg = `Successfully added ${foundUser.username || foundUser.email} to your contacts!`;
      setToastMessage(succMsg);
      setAddContactEmail("");
      setAddContactError("");
      setAddContactSuccess("");
      setAddContactLoading(false);

      // Automatically close the popup modal
      closeModal("addContactModal");

      // Auto dismiss success toast after 4 seconds
      setTimeout(() => {
        setToastMessage((prev) => (prev === succMsg ? "" : prev));
      }, 4000);
    } catch (err) {
      setAddContactError(err.message || "Failed to add contact. Please try again.");
      setAddContactLoading(false);
    }
  };

  // Extract contact list containing ONLY authorized contacts
  const contactList = [];
  if (users && typeof users === "object") {
    Object.keys(users).forEach((key) => {
      const us = users[key];
      if (us && typeof us === "object") {
        if (us.uid === userId) {
          username = us.username || "";
          email = us.email || "";
        } else if (us.uid && myContacts && myContacts[us.uid]) {
          let lastMsg = null;
          let lastMsgTimestamp = 0;
          let unreadCount = 0;

          if (allMessages && typeof allMessages === "object") {
            Object.keys(allMessages).forEach((mKey) => {
              const m = allMessages[mKey];
              if (
                m &&
                ((m.sender === userId && m.receiver === us.uid) ||
                  (m.sender === us.uid && m.receiver === userId))
              ) {
                const ts = Number(mKey) || 0;
                if (ts > lastMsgTimestamp) {
                  lastMsgTimestamp = ts;
                  lastMsg = m;
                }
                if (m.sender === us.uid && m.receiver === userId && m.seen !== true) {
                  unreadCount++;
                }
              }
            });
          }

          contactList.push({
            ...us,
            lastMsgText: lastMsg
              ? (lastMsg.sender === userId ? "You: " : "") + lastMsg.message
              : "No messages yet",
            lastMsgTime: lastMsg ? lastMsg.time : "",
            lastMsgTimestamp,
            unreadCount,
          });
        }
      }
    });

    // Sort contacts: Most recent chat first
    contactList.sort((a, b) => b.lastMsgTimestamp - a.lastMsgTimestamp);
  }

  // Filter contacts by search query
  const filteredContacts = contactList.filter((contact) => {
    const name = contact.username ? contact.username.toLowerCase() : "";
    const mail = contact.email ? contact.email.toLowerCase() : "";
    const q = searchQuery.toLowerCase();
    return name.includes(q) || mail.includes(q);
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-dark)", position: "relative", overflow: "hidden", maxWidth: "100vw" }}>
      {/* Background Glowing Orbs */}
      <div className="auth-blob-1" style={{ opacity: 0.6 }}></div>
      <div className="auth-blob-2" style={{ opacity: 0.6 }}></div>

      {/* Floating Success Toast Banner */}
      {toastMessage && (
        <div className="home-toast-alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>{toastMessage}</span>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => setToastMessage("")}
            title="Close"
          >
            &times;
          </button>
        </div>
      )}

      {/* Top Navbar Header */}
      <header className="app-header">
        <div className="app-nav">
          <div className="app-brand">
            <div className="app-brand-icon">
              <svg viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
            <span className="app-brand-text">Synapse</span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="add-contact-btn"
              data-bs-toggle="modal"
              data-bs-target="#addContactModal"
              onClick={() => {
                setAddContactError("");
                setAddContactSuccess("");
                setAddContactEmail("");
              }}
              title="Add Contact"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Add Contact</span>
            </button>

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
            placeholder="Search contacts..."
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

              return (
                <Link
                  key={contact.uid || index}
                  to={`/Msg/${contact.uid}/${encodeURIComponent(contact.username || "User")}`}
                  className="contact-card"
                >
                  <div className="contact-info-group" style={{ flex: 1, minWidth: 0 }}>
                    <div className="contact-avatar">
                      {initial}
                      <span className={`status-indicator-dot ${isOnline ? "online" : "offline"}`}></span>
                    </div>

                    <div className="contact-details">
                      <div className="contact-name-row">
                        <span className="contact-name">{contact.username || "Unknown User"}</span>
                        {contact.lastMsgTime && (
                          <span className="contact-last-time">{contact.lastMsgTime}</span>
                        )}
                      </div>
                      <div className="contact-preview-row">
                        <span className={`contact-last-msg ${isOnline && !contact.lastMsgTime ? "is-online" : ""}`}>
                          {contact.lastMsgText !== "No messages yet"
                            ? contact.lastMsgText
                            : isOnline
                            ? "Active now"
                            : contact.status || "Offline"}
                        </span>
                        {contact.unreadCount > 0 && (
                          <span className="contact-unread-badge">{contact.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty-state-card">
            <div className="empty-state-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
            </div>
            <div className="empty-state-title">
              {searchQuery ? "No matching contacts found" : "No contacts added yet"}
            </div>
            <p style={{ margin: "0 0 1.25rem 0", fontSize: "0.875rem", color: "var(--text-muted)" }}>
              {searchQuery
                ? `No contact matches "${searchQuery}"`
                : "Add friends by entering their registered email address to start private one-to-one chats."}
            </p>
            {!searchQuery && (
              <button
                type="button"
                className="auth-btn-primary"
                style={{ maxWidth: "200px", margin: "0 auto", padding: "0.65rem 1.25rem", fontSize: "0.9rem" }}
                data-bs-toggle="modal"
                data-bs-target="#addContactModal"
                onClick={() => {
                  setAddContactError("");
                  setAddContactSuccess("");
                  setAddContactEmail("");
                }}
              >
                Add Your First Contact
              </button>
            )}
          </div>
        )}
      </main>

      {/* Add Contact Modal */}
      <div
        className="modal fade custom-dark-modal"
        id="addContactModal"
        tabIndex="-1"
        aria-labelledby="addContactModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title d-flex align-items-center gap-2" id="addContactModalLabel">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                <span>Add New Contact</span>
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <form onSubmit={handleAddContact}>
              <div className="modal-body">
                {addContactError && (
                  <div className="auth-alert-error" style={{ marginBottom: "1rem" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>{addContactError}</span>
                  </div>
                )}

                {addContactSuccess && (
                  <div
                    style={{
                      background: "rgba(16, 185, 129, 0.12)",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      color: "#34d399",
                      padding: "0.85rem 1rem",
                      borderRadius: "12px",
                      fontSize: "0.875rem",
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span>{addContactSuccess}</span>
                  </div>
                )}

                <div className="auth-form-group" style={{ marginBottom: "0.5rem" }}>
                  <label className="auth-label" htmlFor="contactEmailInput">
                    Contact Registered Email
                  </label>
                  <div className="auth-input-wrapper">
                    <div className="auth-input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                    </div>
                    <input
                      id="contactEmailInput"
                      type="email"
                      className="auth-input"
                      placeholder="friend@example.com"
                      value={addContactEmail}
                      onChange={(e) => {
                        setAddContactEmail(e.target.value);
                        setAddContactError("");
                      }}
                      required
                      autoFocus
                    />
                  </div>
                  <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.775rem", color: "var(--text-muted)" }}>
                    Enter the exact email address your friend used to register on Synapse.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary rounded-pill px-4"
                  data-bs-dismiss="modal"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="auth-btn-primary"
                  style={{ width: "auto", padding: "0.5rem 1.25rem", margin: 0 }}
                  disabled={!addContactEmail.trim() || addContactLoading}
                >
                  {addContactLoading ? (
                    <>
                      <div className="auth-spinner" style={{ width: "16px", height: "16px" }}></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add Contact</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

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
