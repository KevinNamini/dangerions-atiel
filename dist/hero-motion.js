/* CSS owns all motion. Suspend it when the hero or the page is out of view. */
(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let inView = true;
  const sync = () => document.documentElement.style.setProperty(
    '--hero-motion-state', inView && !document.hidden && !reduced.matches ? 'running' : 'paused'
  );
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    observer.observe(hero);
  }
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  sync();
})();
