import { useEffect } from "react";
import { getDatabase, ref, update, onDisconnect, onValue } from "firebase/database";

export const getFormattedLastSeen = () => {
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

export const usePresence = (userId) => {
  useEffect(() => {
    if (!userId) return;

    const database = getDatabase();
    const myStatusRef = ref(database, "user/" + userId);
    const connectedRef = ref(database, ".info/connected");

    const setOnline = () => {
      onDisconnect(myStatusRef).update({ status: getFormattedLastSeen() });
      update(myStatusRef, { status: "online" });
    };

    const setOffline = () => {
      update(myStatusRef, { status: getFormattedLastSeen() });
    };

    // Listen to Firebase Realtime Database connection status
    const unsubscribeConnected = onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        if (!document.hidden) {
          setOnline();
        } else {
          setOffline();
        }
      }
    });

    // Handle tab visibility change (switching tabs or minimizing window)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else {
        setOnline();
      }
    };

    // Handle window/tab close or refresh
    const handleUnload = () => {
      setOffline();
    };

    // Handle user idle timeout (2 minutes of inactivity)
    let idleTimer = null;
    const resetIdleTimer = () => {
      if (!document.hidden) {
        setOnline();
      }
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setOffline();
      }, 2 * 60 * 1000);
    };

    const activityEvents = ["mousemove", "keydown", "touchstart", "click", "scroll"];
    activityEvents.forEach((event) =>
      window.addEventListener(event, resetIdleTimer, { passive: true })
    );

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    // Initial setup
    resetIdleTimer();

    return () => {
      unsubscribeConnected();
      activityEvents.forEach((event) =>
        window.removeEventListener(event, resetIdleTimer)
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
      clearTimeout(idleTimer);
    };
  }, [userId]);
};
