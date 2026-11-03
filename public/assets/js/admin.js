document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("form[data-confirm]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      const msg = form.getAttribute("data-confirm") || "Yakin ingin menghapus data ini?";
      if (!window.confirm(msg)) {
        event.preventDefault();
      }
    });
  });
});
