import { Keypoint } from "@tensorflow-models/hand-pose-detection";
import p5Types from "p5";

export const drawFloor = (
  p5: p5Types,
  posList: Keypoint[],
  floorWidth: number,
  floorOffset: number,
  alpha: number
) => {
  p5.push();
  p5.rectMode(p5.CENTER);
  for (let i = 0; i < 12; i++) {
    if (i < 11) {
      // const currentWidth = floors[i].bounds.max.x - floors[i].bounds.min.x;
      // const pointWidth = 100;
      const dist = p5.dist(
        posList[i + 1].x + floorWidth / 11,
        posList[i + 1].y,
        posList[i].x,
        posList[i].y
      );

      const angle = Math.atan2(
        posList[i + 1].y - posList[i].y,
        posList[i + 1].x + floorWidth / 11 - posList[i].x
      );

      p5.push();
      p5.fill(220, alpha);
      //p5.noStroke();
      p5.translate(
        (posList[i].x + posList[i + 1].x + floorWidth / 11) / 2 +
          (i * floorWidth) / 11 +
          floorOffset,
        (posList[i].y + posList[i + 1].y) / 2 + (p5.height / 3) * 2
      );
      p5.rotate(angle);
      p5.noStroke();
      p5.circle(-dist / 2, 0, 10);
      p5.circle(dist / 2, 0, 10);
      p5.rect(0, 0, dist, 10);
      p5.pop();
    }
  }
  p5.pop();
};
