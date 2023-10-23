import { Keypoint } from "@tensorflow-models/hand-pose-detection";
import { spring } from "./calculator/spring";
import { quadraticInOut } from "./calculator/quadraticInOut";

type Animation = "spring" | "quagratic";

export const interpolatedPosition = (
  t: number,
  begin: Keypoint,
  end: Keypoint,
  animation: Animation
) => {
  if (animation == "spring") {
    return { x: spring(begin.x, end.x, t), y: spring(begin.y, end.y, t) };
  } else if (animation == "quagratic") {
    return {
      x: quadraticInOut(begin.x, end.x, t),
      y: quadraticInOut(begin.y, end.y, t),
    };
  } else {
    alert("no animation type detected.");
    return { x: 0, y: 0 };
  }
};
