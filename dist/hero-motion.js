/* CSS owns all motion. Each scene pauses independently when it leaves the screen. */
(() => {
  const scenes = [
    {element: document.querySelector('.hero'), property: '--hero-motion-state'},
    {element: document.querySelector('#chart'), property: '--chronicle-motion-state'}
  ].filter(scene => scene.element);
  if (!scenes.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canObserve = 'IntersectionObserver' in window;
  scenes.forEach(scene => { scene.inView = !canObserve; });
  const sync = () => {
    scenes.forEach(scene => document.documentElement.style.setProperty(
      scene.property, scene.inView && !document.hidden && !reduced.matches ? 'running' : 'paused'
    ));
    document.documentElement.style.setProperty('--entrance-motion-state', document.hidden ? 'paused' : 'running');
  };
  if (canObserve) {
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

  // Content is visible by default, including with JS disabled or reduced motion.
  // Remember players, not DOM nodes: the live feed replaces the ranking markup.
  const seen = new Set();
  const key = element => `${element.parentElement.id}:${element.dataset.player}`;
  const arrive = element => {
    const id = key(element);
    if (seen.has(id)) return;
    seen.add(id);
    if (reduced.matches || document.hidden) return;
    element.classList.add('motion-arrive');
    element.addEventListener('animationend', () => element.classList.remove('motion-arrive'), {once:true});
  };
  const entrances = canObserve ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      arrive(entry.target);
      entrances.unobserve(entry.target);
    });
  }, {threshold:.12}) : null;
  const refreshEntrances = () => {
    entrances?.disconnect();
    document.querySelectorAll('.podium-card,.rank-row:not(.on-podium)').forEach(element => {
      if (seen.has(key(element))) return;
      if (entrances) entrances.observe(element);
      else arrive(element);
    });
  };
  refreshEntrances();
  if ('MutationObserver' in window) {
    const updates = new MutationObserver(refreshEntrances);
    ['podium','roster'].forEach(id => {
      const root = document.getElementById(id);
      if (root) updates.observe(root, {childList:true});
    });
  }
})();
