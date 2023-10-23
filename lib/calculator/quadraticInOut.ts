export const quadraticInOut = (begin: number, end: number, t: number) => {
  const b = begin;
  const c = end - begin;
  t *= 2;
  if (t < 1) {
    return (c / 2) * t ** 2 + b;
  } else {
    t = t - 1;
    return (-c / 2) * (t * (t - 2) - 1) + b;
  }
};
