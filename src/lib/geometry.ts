export const polarToCartesian = (
  cx: number,
  cy: number,
  r: number,
  deg: number
) => {
  const rad = (deg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

export const describePie = (
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  sweepDeg: number
) => {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, startDeg + sweepDeg);
  const largeArc = sweepDeg <= 180 ? 0 : 1;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
};