import { Keypoint } from "@tensorflow-models/hand-pose-detection";
import { Handpose } from "../@types/global";
// import { Node } from "./NodeClass";

type Animation = "spring" | "quagratic";

export class Point {
  id: number;
  pos: Keypoint;
  centerPoint: number; //handposeから何番目のpointを中心として取得するかを指定.
  isActive: boolean;
  private posRule: (handpose: Handpose, centerPoint: number) => Keypoint;

  neighbors: { prevId: number | null; nextId: number | null };
  morphing: {
    state: "switch" | "activate" | "deactivate" | null;
    progress: number;
    targetId: number | null;
    animation: Animation;
  };
  constructor(
    id: number,
    pos: Keypoint,
    isActive: boolean,
    centerPoint: number
  ) {
    this.id = id;
    this.pos = pos;
    this.posRule = (handpose: Handpose, centerPoint: number) => {
      return handpose[centerPoint];
    };
    this.centerPoint = centerPoint;
    this.isActive = isActive;
    this.neighbors = { prevId: id, nextId: id };
    this.morphing = {
      state: null,
      progress: 0,
      targetId: null,
      animation: "quagratic",
    }; //targetId: switchの時のみ使用
  }
  setPosRule(rule: (handpose: Handpose, centerPoint: number) => Keypoint) {
    this.posRule = rule;
  }

  setNeighbors(neighbors: { prevId: number | null; nextId: number | null }) {
    this.neighbors = neighbors;
  }

  setActiveState(state: boolean) {
    this.isActive = state;
  }

  update(handpose: Handpose) {
    this.pos = this.posRule(handpose, this.centerPoint);
  }
}
