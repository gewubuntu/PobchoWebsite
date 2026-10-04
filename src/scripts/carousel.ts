// Scroll-snap carousel controls: prev/next buttons, disabled state at the ends and arrow-key support.

export function initCarousels(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-carousel]:not([data-ready])").forEach((carousel) => {
    carousel.dataset.ready = "";
    const track = carousel.querySelector<HTMLElement>(".carousel__track");
    const [prev, next] = carousel.querySelectorAll<HTMLButtonElement>(".carousel__nav");
    if (!track || !prev || !next) return;

    const slides = () => Array.from(track.children) as HTMLElement[];

    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      prev.disabled = track.scrollLeft <= 1;
      next.disabled = track.scrollLeft >= max - 1;
    };

    // Scroll so the next slide outside the visible area becomes the first fully visible one.
    const step = (dir: 1 | -1) => {
      const { left: trackLeft } = track.getBoundingClientRect();
      const offsets = slides().map((slide) => slide.getBoundingClientRect().left - trackLeft);
      const target =
        dir > 0 ? offsets.find((offset) => offset > 1) : [...offsets].reverse().find((offset) => offset < -1);
      if (target !== undefined) track.scrollBy({ left: target });
    };

    prev.addEventListener("click", () => step(-1));
    next.addEventListener("click", () => step(1));
    track.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
      else return;
      event.preventDefault();
    });
    track.addEventListener("scroll", update, { passive: true });
    new ResizeObserver(update).observe(track);
    update();
  });
}
