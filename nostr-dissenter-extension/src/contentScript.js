(function () {
  if (window.__nostrDissenterInjected) return;
  window.__nostrDissenterInjected = true;

  const bubble = document.createElement("div");
  Object.assign(bubble.style, {
    position: "fixed", bottom: "20px", right: "20px", width: "40px", height: "40px",
    borderRadius: "50%", background: "#f48024", color: "#fff", display: "flex",
    alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 9999,
    fontSize: "22px", userSelect: "none", boxShadow: "0 2px 6px rgba(0,0,0,0.25)"
  });
  bubble.textContent = "💬";
  bubble.title = "View Nostr comments";
  document.body.appendChild(bubble);

  bubble.addEventListener("click", () => {
    if (document.getElementById("nostr-comment-sidebar")) return;
    const sidebar = document.createElement("iframe");
    sidebar.id = "nostr-comment-sidebar";
    sidebar.src = chrome.runtime.getURL("sidebar.html");
    Object.assign(sidebar.style, {
      position: "fixed", top: 0, right: 0, width: "400px", height: "100%", border: "none",
      zIndex: 10000, boxShadow: "-3px 0 8px rgba(0,0,0,0.3)"
    });
    document.body.appendChild(sidebar);
  });
})();