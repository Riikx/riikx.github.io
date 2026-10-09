'use strict';
function stepCabinControls(state, input, delta) {
  const ease=1-Math.exp(-7*delta);
  const throttle=Number(input.has('ArrowUp'))-Number(input.has('ArrowDown'));
  const steer=Number(input.has('ArrowRight'))-Number(input.has('ArrowLeft'));
  state.speed+=(throttle*5-state.speed)*ease;
  state.turn+=(steer*.85-state.turn)*ease;
  state.heading+=state.turn*delta;
  return {dx:Math.cos(state.heading)*state.speed*delta/40,
    dy:Math.sin(state.heading)*state.speed*delta/25};
}
