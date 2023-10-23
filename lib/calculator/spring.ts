export const spring = (begin: number, end: number, t: number) => {
  t *= 100;
  const A = 2 * (begin - end);
  return (A / (t + 1)) * Math.sin(t) + end;
};
