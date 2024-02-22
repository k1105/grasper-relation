import dynamic from "next/dynamic";
import p5Types from "p5";
import { MutableRefObject, RefObject, useRef } from "react";
import { Hand } from "@tensorflow-models/hand-pose-detection";
import { getSmoothedHandpose } from "../lib/getSmoothedHandpose";
import { convertHandToHandpose } from "../lib/converter/convertHandToHandpose";
import { isFront } from "../lib/detector/isFront";
import { Monitor } from "../components/Monitor";
import { Handpose } from "../@types/global";
import { DisplayHands } from "../lib/DisplayHandsClass";
import { HandposeHistory } from "../lib/HandposeHitsoryClass";
import { Point } from "../lib/PointClass";
import { Group } from "../lib/GroupClass";
import { Ball } from "../lib/BallClass";
import { animationSequence } from "../components/animationSequence";
import { Keypoint } from "@tensorflow-models/hand-pose-detection";
import Matter from "matter-js";
import * as Tone from "tone";
import { drawFloor } from "../components/drawFloor";
import { animationSequence02 } from "../components/animationSequence02";
import { StaticTarget } from "../lib/StaticTargetClass";
import { Effect } from "../lib/EffectClass";
import { resizeHandpose } from "../lib/converter/resizeHandpose";

type Props = {
  handpose: MutableRefObject<Hand[]>;
  isLost: RefObject<boolean>;
};
const Sketch = dynamic(import("react-p5"), {
  loading: () => <></>,
  ssr: false,
});

export const HandSketch = ({ handpose, isLost }: Props) => {
  const handposeHistory = new HandposeHistory();
  const displayHands = new DisplayHands();
  const gainRef = useRef<number>(1.5);
  const floorWidth = window.innerWidth * 0.9;
  const floorOffset = (window.innerWidth - floorWidth) / 2;
  const posList: Keypoint[] = new Array(12).fill({ x: 0, y: 0 });
  const randomList = useRef<number[]>([4, 3, 2, 1, 0]);
  const scene01FinishRef = useRef<boolean>(false);
  const scene02FinishRef = useRef<boolean>(false);
  const scene03FinishRef = useRef<boolean>(true);
  const floorVisibilityRef = useRef<boolean>(false);
  const ballVisibilityRef = useRef<boolean>(false);
  const targetVisibilityRef = useRef<boolean>(false);
  const targets: StaticTarget[] = [];
  const score = useRef<number>(0);
  const effectList: Effect[] = [];
  let floorAlpha = 0;
  let ballAlpha = 255;

  const debugLog = useRef<{ label: string; value: any }[]>([]);

  const timeList: number[] = [];
  for (let i = 0; i < 20; i++) {
    timeList.push((i + 1) * 5000);
  }

  // module aliases
  let Engine = Matter.Engine,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite;
  const floors: Matter.Body[] = [];

  const player = new Tone.Player(
    "https://k1105.github.io/sound_effect/audio/wood_attack.m4a"
  ).toDestination();
  for (let i = 0; i < 11; i++) {
    // foors
    floors.push(
      Bodies.rectangle(
        (floorWidth / 11) * i + floorWidth / 11 / 2 + floorOffset,
        window.innerHeight - 50,
        floorWidth / 11,
        100,
        { restitution: 0.3, isStatic: true }
      )
    );
  }

  const leftFingers: Group[] = [];
  for (let i = 0; i < 5; i++) {
    const points: Point[] = [];
    for (let j = 0; j < 5; j++) {
      if (j == 0) {
        points.push(new Point(0, { x: 0, y: 0 }, true, 0));
      } else {
        points.push(new Point(4 * i + j, { x: 0, y: 0 }, true, 4 * i + j));
      }
    }
    points.push(new Point(20 + i, { x: 0, y: 0 }, false, 4 * i + 1));
    points[5].setPosRule((handpose: Handpose, currentPoint: number) => {
      const r = 40;
      const dist = Math.min(
        2 * r,
        Math.max(handpose[currentPoint].y - handpose[currentPoint + 3].y, 0)
      );
      return {
        x: handpose[currentPoint].x - Math.sqrt(r ** 2 - (dist / 2) ** 2),
        y: -dist / 2 + handpose[currentPoint].y,
      };
    });
    points.push(new Point(25 + i, { x: 0, y: 0 }, false, 4 * i + 1));
    points[6].setPosRule((handpose: Handpose, currentPoint: number) => {
      const r = 40;
      const dist = Math.min(
        2 * r,
        Math.max(handpose[currentPoint].y - handpose[currentPoint + 3].y, 0)
      );
      return {
        x: handpose[currentPoint].x,
        y: -dist + handpose[currentPoint].y,
      };
    });
    leftFingers.push(new Group(i, points));
    leftFingers[i].setPositionSequence([
      () => {
        return {
          x: window.innerWidth / 2 - 300,
          y: (window.innerHeight / 3) * 2,
        };
      },
      (handpose: Handpose, groupId: number) => {
        return {
          x: (floorWidth / 11) * (5 - groupId) + floorOffset,
          y: (window.innerHeight / 3) * 2,
        };
      },
    ]);
  }

  const rightFingers: Group[] = [];
  for (let i = 0; i < 5; i++) {
    const points: Point[] = [];
    for (let j = 0; j < 5; j++) {
      if (j == 0) {
        points.push(new Point(0, { x: 0, y: 0 }, true, 0));
      } else {
        points.push(new Point(4 * i + j, { x: 0, y: 0 }, true, 4 * i + j));
      }
    }
    points.push(new Point(20 + i, { x: 0, y: 0 }, false, 4 * i + 1));
    points[5].setPosRule((handpose: Handpose, currentPoint: number) => {
      const r = 40;
      const dist = Math.min(
        2 * r,
        Math.max(handpose[currentPoint].y - handpose[currentPoint + 3].y, 0)
      );
      points.push(new Point(25 + i, { x: 0, y: 0 }, false, 4 * i + 1));
      points[6].setPosRule((handpose: Handpose, currentPoint: number) => {
        const r = 40;
        const dist = Math.min(
          2 * r,
          Math.max(handpose[currentPoint].y - handpose[currentPoint + 3].y, 0)
        );
        return {
          x: handpose[currentPoint].x,
          y: -dist + handpose[currentPoint].y,
        };
      });
      return {
        x: handpose[currentPoint].x + Math.sqrt(r ** 2 - (dist / 2) ** 2),
        y: -dist / 2 + handpose[currentPoint].y,
      };
    });
    rightFingers.push(new Group(i, points));
    rightFingers[i].setPositionSequence([
      () => {
        return {
          x: window.innerWidth / 2 + 300,
          y: (window.innerHeight / 3) * 2,
        };
      },
      (handpose: Handpose, groupId: number) => {
        return {
          x: (floorWidth / 11) * (groupId + 5 + 1) + floorOffset,
          y: (window.innerHeight / 3) * 2,
        };
      },
    ]);
  }

  const balls: Ball[] = [];

  // create an engine
  let engine: Matter.Engine;

  const preload = (p5: p5Types) => {
    // 画像などのロードを行う
  };

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    p5.stroke(200);
    p5.fill(200);
    p5.strokeWeight(1);
    engine = Engine.create();
    Composite.add(engine.world, [
      ...balls.map((b) => b.body),
      ...floors,
      // ...bucket,
    ]);
  };

  const draw = (p5: p5Types) => {
    const rawHands: {
      left: Handpose;
      right: Handpose;
    } = convertHandToHandpose(handpose.current);
    handposeHistory.update(rawHands);
    let hands: {
      left: Handpose;
      right: Handpose;
    } = getSmoothedHandpose(rawHands, handposeHistory); //平滑化された手指の動きを取得する
    hands = {
      left: resizeHandpose(hands.left, gainRef.current),
      right: resizeHandpose(hands.right, gainRef.current),
    };

    // logとしてmonitorに表示する
    debugLog.current = [];
    for (const hand of handpose.current) {
      debugLog.current.push({
        label: hand.handedness + " accuracy",
        value: hand.score,
      });
      debugLog.current.push({
        label: hand.handedness + " is front",
        //@ts-ignore
        value: isFront(hand.keypoints, hand.handedness.toLowerCase()),
      });
    }

    p5.clear();

    displayHands.update(hands);

    if (displayHands.left.pose.length > 0) {
      p5.push();
      p5.fill(200, displayHands.left.opacity);
      leftFingers.forEach((finger, index) => {
        finger.update(displayHands.left.pose);
        finger.show(p5);
      });
      p5.pop();
    }

    if (displayHands.right.pose.length > 0) {
      p5.push();
      p5.fill(200, displayHands.right.opacity);
      rightFingers.forEach((finger, index) => {
        finger.update(displayHands.right.pose);
        finger.show(p5);
      });
      p5.pop();
    }

    if (hands.left.length > 0) {
      for (let i = 0; i < 5; i++) {
        const j = randomList.current[i];
        posList[i + 1] = {
          x: hands.left[4 * j + 4].x - hands.left[4 * j + 1].x,
          y: hands.left[4 * j + 4].y - hands.left[4 * j + 1].y,
        };
      }
    }
    if (hands.right.length > 0) {
      for (let i = 0; i < 5; i++) {
        const j = randomList.current[i];
        posList[10 - i] = {
          x: hands.right[4 * j + 4].x - hands.right[4 * j + 1].x,
          y: hands.right[4 * j + 4].y - hands.right[4 * j + 1].y,
        };
      }
    }

    if (floorVisibilityRef.current) {
      floorAlpha = Math.min(floorAlpha + 1, 255);
    } else {
      floorAlpha = Math.max(floorAlpha - 1, 0);
    }

    if (ballVisibilityRef.current) {
      // ballAlpha = 255;
      ballAlpha = 255;
    } else {
      ballAlpha = Math.max(ballAlpha - 10, 0);
    }

    drawFloor(p5, posList, floorWidth, floorOffset, floorAlpha);

    for (let i = 0; i < 11; i++) {
      Matter.Body.setVertices(floors[i], [
        { x: posList[i].x, y: posList[i].y },
        { x: posList[i + 1].x + floorWidth / 11, y: posList[i + 1].y },
        {
          x: posList[i + 1].x + floorWidth / 11,
          y: posList[i + 1].y + 10,
        },
        { x: posList[i].x, y: posList[i].y + 10 },
      ]);
      Matter.Body.setPosition(
        floors[i],
        {
          x:
            (posList[i].x + posList[i + 1].x + floorWidth / 11) / 2 +
            (i * floorWidth) / 11 +
            floorOffset,
          y: (posList[i].y + posList[i + 1].y) / 2 + (p5.height / 3) * 2,
        }, //@ts-ignore
        true
      );
    }

    if (ballVisibilityRef.current && balls.length == 0) {
      //@ts-ignore
      const newBall = new Ball({ x: window.innerWidth / 2, y: -1000 }, 60);
      Matter.Body.setDensity(newBall.body, 1);
      newBall.body.restitution = 0.15;
      balls.push(newBall);
      Composite.add(engine.world, newBall.body);
      score.current = 0;
    }

    for (const ball of balls) {
      const circle = ball.body;
      if (
        circle.position.y > p5.height + 200 ||
        circle.position.x > p5.width + 200 ||
        circle.position.x < -200
      ) {
        Composite.remove(engine.world, ball.body);
        const targetId = balls.indexOf(ball);
        balls.splice(targetId, 1);
      }
    }

    for (const target of targets) {
      target.update(balls, score);
      if (target.state == "hit") {
        Matter.Body.scale(balls[0].body, 0.7, 0.7);
        balls[0].setMultiply(0.7);
        balls[0].updateScale(0.7);
        Tone.loaded().then(() => {
          player.start();
        });
        effectList.push(new Effect(target.position));
        target.state = "dying";
      }
      if (target.state == "dead") {
        const targetId = targets.indexOf(target);
        targets.splice(targetId, 1);
      }
    }

    for (const effect of effectList) {
      effect.update();
      effect.show(p5);
      if (effect.state == "dead") {
        const target = effectList.indexOf(effect);
        effectList.splice(target, 1);
      }
    }

    if (targetVisibilityRef.current && targets.length == 0) {
      while (targets.length < 1) {
        targets.push(
          new StaticTarget({
            position: {
              x: window.innerWidth * (Math.random() * 0.8 + 0.1),
              y: window.innerHeight * (Math.random() * 0.3 + 0.1),
            },
            size: 30,
          })
        );
      }
    }

    Engine.update(engine);

    /* draw circle */
    for (const ball of balls) {
      p5.push();
      p5.noStroke();
      p5.fill(255, ballAlpha);
      ball.show(p5);
      p5.pop();
    }
    for (const target of targets) target.show(p5);

    if (!isLost.current && scene03FinishRef.current) {
      // // Animation
      animationSequence(leftFingers, scene01FinishRef);
      animationSequence(rightFingers, scene01FinishRef);
      scene03FinishRef.current = false;
    }

    if (!isLost.current && scene01FinishRef.current) {
      setTimeout(() => {
        floorVisibilityRef.current = true;
      }, 5000);

      setTimeout(() => {
        ballVisibilityRef.current = true;
      }, 10000);

      setTimeout(() => {
        targetVisibilityRef.current = true;
      }, 20000);
      scene01FinishRef.current = false;
    }

    if (score.current >= 30) {
      scene02FinishRef.current = true;
      targetVisibilityRef.current = false;
      ballVisibilityRef.current = false;
      balls[0].updateScale(0.1);
      setTimeout(() => {
        animationSequence02(leftFingers, scene03FinishRef);
        animationSequence02(rightFingers, scene03FinishRef);
        if (balls.length > 0) {
          Composite.remove(engine.world, balls[0].body);
          balls.splice(0, 1);
        }
      }, 1000);
      setTimeout(() => {
        floorVisibilityRef.current = false;
      }, 1000);
      score.current = 0;
    }
  };

  const windowResized = (p5: p5Types) => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
  };

  return (
    <>
      <Monitor handpose={handpose} debugLog={debugLog} gain={gainRef} />
      <Sketch
        preload={preload}
        setup={setup}
        draw={draw}
        windowResized={windowResized}
      />
    </>
  );
};
