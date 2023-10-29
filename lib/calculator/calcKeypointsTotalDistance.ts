import { Keypoint } from "@tensorflow-models/hand-pose-detection";
import { Handpose } from "../../@types/global";

export const calcKeypointsTotalDistance = (handpose: Handpose) => {
  let res = 0;

  for (let i = 0; i < 5; i++) {
    res += dist(handpose[0], handpose[4 * i + 1]);
    for (let j = 1; j < 4; j++) {
      res += dist(handpose[4 * i + j], handpose[4 * i + j + 1]);
    }
  }
  return res;
};

const dist = (posA: Keypoint, posB: Keypoint) => {
  return Math.sqrt((posA.x - posB.x) ** 2 + (posA.y - posB.y) ** 2);
};
