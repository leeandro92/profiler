(function () {
  const STORAGE_KEY = "profiler-theme";
  const root = document.documentElement;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  const initialTheme = savedTheme || (prefersDark ? "dark" : "light");

  applyTheme(initialTheme);

  document.addEventListener("DOMContentLoaded", () => {
    const buttons = [...document.querySelectorAll("[data-theme-toggle]")];
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
        localStorage.setItem(STORAGE_KEY, nextTheme);
        applyTheme(nextTheme);
      });
    });

    syncButtons(buttons);
  });

  function applyTheme(theme) {
    const safeTheme = theme === "dark" ? "dark" : "light";
    root.dataset.theme = safeTheme;
    syncButtons([...document.querySelectorAll("[data-theme-toggle]")]);
  }

  function syncButtons(buttons) {
    if (!buttons.length) return;

    const isDark = root.dataset.theme === "dark";
    buttons.forEach((button) => {
      const icon = button.querySelector(".theme-toggle-icon");
      const text = button.querySelector(".theme-toggle-text");
      button.setAttribute("aria-pressed", String(isDark));
      button.setAttribute("title", isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
      if (icon) icon.textContent = isDark ? "☀" : "☾";
      if (text) text.textContent = isDark ? "Claro" : "Oscuro";
    });
  }
})();
