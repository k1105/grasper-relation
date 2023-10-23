import { Keypoint } from "@tensorflow-models/hand-pose-detection";
import { Handpose } from "../@types/global";
import { quadraticInOut } from "./calculator/quadraticInOut";
import { spring } from "./calculator/spring";

type AnimationType = "spring" | "quadratic";

export class Node {
  private position: Keypoint;
  positionCurrentRule: (handpose: Handpose, index: number) => Keypoint;
  positionNextRule: (handpose: Handpose, index: number) => Keypoint;
  private transitionProgress: number;
  private transitionBeginAt: number;
  private animationType: AnimationType;
  positionSequenceHead: number;

  constructor(position: Keypoint) {
    this.position = position;
    this.positionCurrentRule = (handpose: Handpose, index: number) => {
      return { x: 0, y: 0 };
    };
    this.positionNextRule = (handpose: Handpose, index: number) => {
      return { x: 0, y: 0 };
    };
    this.positionSequenceHead = 0;
    this.transitionProgress = 1; //0-1.
    this.transitionBeginAt = 0;
    this.animationType = "quadratic";
  }

  getPosition = () => {
    return this.position;
  };

  getTransitionProgress = () => {
    return this.transitionProgress;
  };

  updatePosition = (handpose: Handpose, index: number) => {
    if (this.transitionProgress < 1) {
      const t = this.transitionProgress;
      const currentPos = this.positionCurrentRule(handpose, index);
      const nextPos = this.positionNextRule(handpose, index);
      if (this.animationType == "quadratic") {
        this.position = {
          x: quadraticInOut(currentPos.x, nextPos.x, t),
          y: quadraticInOut(currentPos.y, nextPos.y, t),
        };
      } else if (this.animationType == "spring") {
        this.position = {
          x: spring(currentPos.x, nextPos.x, t),
          y: spring(currentPos.y, nextPos.y, t),
        };
      }

      this.transitionProgress = Math.min(
        (new Date().getTime() - this.transitionBeginAt) / 1000,
        1
      );
    } else {
      this.positionCurrentRule = this.positionNextRule;
      this.position = this.positionCurrentRule(handpose, index);
    }
  };

  setPositionRule = (rule: (handpose: Handpose, index: number) => Keypoint) => {
    this.positionCurrentRule = rule;
    this.positionNextRule = rule;
  };

  updatePositionRule = (
    rule: (handpose: Handpose, index: number) => Keypoint,
    animationType: AnimationType = "quadratic"
  ) => {
    this.transitionProgress = 0;
    this.transitionBeginAt = new Date().getTime();
    this.positionNextRule = rule;
    this.animationType = animationType;
  };
}
