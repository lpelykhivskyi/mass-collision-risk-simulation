export function clamp(value, low = 0, high = 1) {
  return Math.max(low, Math.min(high, value));
}

export function round(value, digits = 3) {
  return Number(value.toFixed(digits));
}

export function degToRad(deg) {
  return (deg * Math.PI) / 180;
}
