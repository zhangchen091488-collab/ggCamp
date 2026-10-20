// Ephemeral presentation choices; never stored in the player's learning state.
function createActionPicker(random = Math.random) {
  const scopes = new Map();
  return function pick(key, face, event, choices) {
    if (choices.length < 2) return choices[0];
    let state = scopes.get(key);
    if (!state) { state = { last: {} }; scopes.set(key, state); }
    if (state.face === face && state.event === event && choices.includes(state.current)) return state.current;
    const candidates = choices.filter(id => id !== state.last[face]);
    const value = Number(random());
    const index = Math.min(candidates.length - 1, Math.max(0, Math.floor((Number.isFinite(value) ? value : 0) * candidates.length)));
    state.current = candidates[index]; state.last[face] = state.current;
    state.face = face; state.event = event;
    return state.current;
  };
}
module.exports = { createActionPicker };
