import "./styles.css";

document.documentElement.classList.add("js");

for (const button of document.querySelectorAll("[data-copy]")) {
  button.addEventListener("click", async () => {
    const label = button.querySelector("[data-copy-label]");
    const original = label.textContent;
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      label.textContent = "COPIED";
      button.classList.add("copied");
    } catch {
      label.textContent = "SELECT";
      const range = document.createRange();
      range.selectNodeContents(button.querySelector("code"));
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }
    window.setTimeout(() => {
      label.textContent = original;
      button.classList.remove("copied");
      window.getSelection()?.removeAllRanges();
    }, 1600);
  });
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      }
    },
    { threshold: 0.15 },
  );
  for (const element of document.querySelectorAll("[data-reveal]")) observer.observe(element);
} else {
  for (const element of document.querySelectorAll("[data-reveal]")) element.classList.add("visible");
}
