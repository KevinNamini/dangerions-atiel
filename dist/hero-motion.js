/* CSS owns all motion. Each scene pauses independently when it leaves the screen. */
(() => {
  const scenes = [
    {element: document.querySelector('.hero'), property: '--hero-motion-state'},
    {element: document.querySelector('#chart'), property: '--chronicle-motion-state'}
  ].filter(scene => scene.element);
  if (!scenes.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  scenes.forEach(scene => { scene.inView = false; });
  const sync = () => scenes.forEach(scene => document.documentElement.style.setProperty(
    scene.property, scene.inView && !document.hidden && !reduced.matches ? 'running' : 'paused'
  ));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const scene = scenes.find(scene => scene.element === entry.target);
        if (scene) scene.inView = entry.isIntersecting;
      });
      sync();
    });
    scenes.forEach(scene => observer.observe(scene.element));
  }
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  sync();
})();
