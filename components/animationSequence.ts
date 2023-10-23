import { Group } from "../lib/GroupClass";

export const animationSequence = (fingers: Group[]) => {
  const timeList: number[] = [];
  for (let i = 0; i < 20; i++) {
    timeList.push((i + 1) * 5000);
  }

  setTimeout(() => {
    for (const finger of fingers) {
      finger.moveTo(1);
    }
  }, timeList[0]);

  setTimeout(() => {
    for (const finger of fingers) {
      finger.deactivate(0);
    }
  }, timeList[1]);

  setTimeout(() => {
    for (const finger of fingers) {
      finger.deactivate(4 * finger.id + 2);
    }
  }, timeList[2]);

  setTimeout(() => {
    for (const finger of fingers) {
      finger.deactivate(4 * finger.id + 3);
    }
  }, timeList[3]);
};
