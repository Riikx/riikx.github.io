'use strict';
(() => {
  const map = document.querySelector('.map');
  const nodes = [...map.querySelectorAll('.node')];
  const home = map.querySelector('.home');
  const ring = map.querySelector('.orbit');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let angle = 0, previous = 0, hovering = false, pressing = false;
  let width = 0, height = 0, radiusX = 0, radiusY = 0;
  const sizes = [];

  function position() {
    nodes.forEach((node, index) => {
      const phase = angle - Math.PI * 5 / 6 + index * Math.PI * 2 / nodes.length;
      const x = width / 2 + Math.cos(phase) * radiusX;
      const y = height / 2 + Math.sin(phase) * radiusY;
      node.style.left = `${x - sizes[index].width / 2}px`;
      node.style.top = `${y - sizes[index].height / 2}px`;
    });
  }

  function measure() {
    width = map.clientWidth;
    height = map.clientHeight;
    nodes.forEach((node, index) => {
      node.style.right = 'auto';
      node.style.bottom = 'auto';
      node.style.maxWidth = 'calc(100% - 40px)';
      node.style.width = width < 600 ? `${Math.min(170, (width - 48) / 2.8)}px` : '';
      node.style.padding = width < 600 ? '12px 10px' : '';
      node.style.fontSize = width < 600 ? '12px' : '';
      node.querySelector('i').style.display = width < 600 ? 'none' : '';
      sizes[index] = {width: node.offsetWidth, height: node.offsetHeight};
    });
    const widest = Math.max(...sizes.map(s => s.width));
    const tallest = Math.max(...sizes.map(s => s.height));
    radiusX = Math.max(0, Math.min(width * .32, (width - widest) / 2 - 24));
    radiusY = Math.max(0, Math.min(height * .32, (height - tallest) / 2 - 42));
    home.style.left = '50%';
    home.style.top = '50%';
    home.style.transform = 'translate(-50%, -50%)';
    ring.style.width = `${radiusX * 2}px`;
    ring.style.height = `${radiusY * 2}px`;
    ring.style.transform = 'translate(-50%, -50%)';
    position();
  }

  map.addEventListener('pointerenter', event => {if (event.pointerType !== 'touch') hovering = true;});
  map.addEventListener('pointerleave', () => {hovering = false;});
  map.addEventListener('pointerdown', () => {pressing = true;});
  window.addEventListener('pointerup', () => {pressing = false;});
  window.addEventListener('pointercancel', () => {pressing = false;});
  window.addEventListener('blur', () => {pressing = false; hovering = false;});

  function animate(time) {
    const elapsed = previous ? Math.min((time - previous) / 1000, .05) : 0;
    previous = time;
    const paused = motion.matches || document.hidden || hovering || pressing ||
      map.contains(document.activeElement) || Boolean(document.querySelector('dialog[open]'));
    if (!paused) {
      angle = (angle + elapsed * Math.PI * 2 / 65) % (Math.PI * 2);
      position();
    }
    requestAnimationFrame(animate);
  }
  new ResizeObserver(measure).observe(map);
  measure();
  requestAnimationFrame(animate);
})();
