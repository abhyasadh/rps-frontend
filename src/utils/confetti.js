import confetti from "canvas-confetti";

// Draw on the main thread: the app CSP blocks blob: workers, which leaves a
// blank offscreen-transferred canvas if canvas-confetti tries to use one.
const fireConfetti = confetti.create(null, { useWorker: false, resize: true });

const colors = ["#ffffff", "#22c55e", "#60a5fa", "#e5e7eb"];

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const fireWinnerConfetti = () => {
  if (prefersReducedMotion()) return;

  const isMobile =
    typeof window !== "undefined" && window.innerWidth <= 768;
  const originX = isMobile ? 0.5 : 0.25;

  const burst = {
    particleCount: 50,
    spread: 70,
    startVelocity: 45,
    ticks: 140,
    gravity: 1,
    decay: 0.92,
    scalar: 0.9,
    zIndex: 9999,
    colors,
  };

  fireConfetti({
    ...burst,
    origin: { x: originX, y: 0.65 },
  });
};
