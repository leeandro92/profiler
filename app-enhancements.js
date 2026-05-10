(function () {
  const STATUS_SELECTORS = [
    "#authStatus",
    "#verificationNoticeStatus",
    "#statusMessage",
    "#adminCalendarStatus",
    "#grillaStatus",
    "#historyNotice",
  ];

  document.addEventListener("DOMContentLoaded", () => {
    const toastRegion = createToastRegion();

    observeStatusMessages(toastRegion);
    document.documentElement.classList.add("enhancements-ready");
  });

  function createToastRegion() {
    const region = document.createElement("div");
    region.className = "app-toast-region";
    region.setAttribute("aria-live", "polite");
    document.body.appendChild(region);
    return region;
  }

  function observeStatusMessages(region) {
    STATUS_SELECTORS.forEach((selector) => {
      const element = document.querySelector(selector);
      if (!element) return;

      let lastMessage = element.textContent.trim();
      const observer = new MutationObserver(() => {
        const message = element.textContent.trim();
        if (!message || message === lastMessage || message.length < 4) return;
        lastMessage = message;
        showToast(region, message, getStatusType(element));
      });

      observer.observe(element, {
        attributes: true,
        childList: true,
        characterData: true,
        subtree: true,
      });
    });
  }

  function getStatusType(element) {
    const className = String(element.className || "");
    const status = element.dataset.status || "";
    if (className.includes("error") || status === "error") return "error";
    if (className.includes("success") || status === "success") return "success";
    if (className.includes("loading") || status === "loading") return "loading";
    return "neutral";
  }

  function showToast(region, message, type) {
    const toast = document.createElement("div");
    toast.className = "app-toast";
    toast.dataset.type = type;
    toast.innerHTML = `<p>${escapeHtml(message)}</p>`;
    region.appendChild(toast);

    window.setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px) scale(0.98)";
      window.setTimeout(() => toast.remove(), 220);
    }, type === "error" ? 5200 : 3600);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
