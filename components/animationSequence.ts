import { MutableRefObject } from "react";
import { Group } from "../lib/GroupClass";

export const animationSequence = (
  fingers: Group[],
  finishRef: MutableRefObject<boolean>
) => {
  const timeList: number[] = [5, 10, 11, 12];

  setTimeout(() => {
    for (const finger of fingers) {
      finger.moveTo(1);
    }
  }, timeList[0] * 1000);

  setTimeout(() => {
    for (const finger of fingers) {
      finger.deactivate(0);
    }
  }, timeList[1] * 1000);

  setTimeout(() => {
    for (const finger of fingers) {
      finger.deactivate(4 * finger.id + 2);
    }
  }, timeList[2] * 1000);

  setTimeout(() => {
    for (const finger of fingers) {
      finger.deactivate(4 * finger.id + 3);
    }
  }, timeList[3] * 1000);

  setTimeout(() => {
    finishRef.current = true;
  }, timeList[timeList.length - 1] * 1000);
};
