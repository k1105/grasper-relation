import { MutableRefObject } from "react";
import { Group } from "../lib/GroupClass";

export const animationSequence02 = (
  fingers: Group[],
  finishRef: MutableRefObject<boolean>
) => {
  const timeList: number[] = [3, 4, 5, 10];

  setTimeout(() => {
    for (const finger of fingers) {
      finger.activate(4 * finger.id + 2);
    }
  }, timeList[0] * 1000);

  setTimeout(() => {
    for (const finger of fingers) {
      finger.activate(4 * finger.id + 3);
    }
  }, timeList[1] * 1000);

  setTimeout(() => {
    for (const finger of fingers) {
      finger.activate(0);
    }
  }, timeList[2] * 1000);

  setTimeout(() => {
    for (const finger of fingers) {
      finger.moveTo(0);
    }
  }, timeList[3] * 1000);

  setTimeout(() => {
    finishRef.current = true;
  }, timeList[timeList.length - 1] * 1000);
};
