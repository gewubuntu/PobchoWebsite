// Fade sections in once they scroll into view (styles live in global.scss).

const targets = document.querySelectorAll<HTMLElement>(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.1 },
  );
  targets.forEach((target) => observer.observe(target));
} else {
  targets.forEach((target) => target.classList.add("is-visible"));
}
