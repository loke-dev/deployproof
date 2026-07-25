import "./styles.css";

for (const button of document.querySelectorAll("[data-copy]")) {
  button.addEventListener("click", async () => {
    await navigator.clipboard.writeText(button.dataset.copy);
    const label = button.querySelector("[data-copy-label]");
    const original = label.textContent;
    label.textContent = "COPIED";
    button.classList.add("copied");
    window.setTimeout(() => {
      label.textContent = original;
      button.classList.remove("copied");
    }, 1600);
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    }
  },
  { threshold: 0.15 },
);

for (const element of document.querySelectorAll("[data-reveal]")) observer.observe(element);

