import { Keypoint } from "@tensorflow-models/hand-pose-detection";
import { Point } from "./PointClass";
import p5Types from "p5";
import { Handpose } from "../@types/global";
import { quadraticInOut } from "./calculator/quadraticInOut";
import { spring } from "./calculator/spring";

export class Group {
  id: number;
  currentSequenceId: number;
  morphing: {
    state: "switching" | null;
    progress: number;
    targetId: number | null;
  };
  points: Point[];
  displayPositions: { id: number; pos: Keypoint; radius: number }[];
  private positionSequence: ((
    handpose: Handpose,
    groupId: number
  ) => Keypoint)[];
  position: Keypoint;
  changeLog: string[];
  constructor(id: number, points: Point[], position = { x: 0, y: 0 }) {
    this.id = id;
    this.currentSequenceId = 0;
    this.points = points;
    this.displayPositions = [];
    this.changeLog = [];
    this.positionSequence = [];
    this.position = position;
    this.morphing = { state: null, progress: 0, targetId: null }; //targetId: switchの時のみ使用
  }

  setPositionSequence(
    positionSequence: ((handpose: Handpose, groupId: number) => Keypoint)[]
  ) {
    this.positionSequence = positionSequence;
  }

  moveTo(id: number) {
    this.morphing = { state: "switching", progress: 0, targetId: id };
  }

  getNeighbors(id: number) {
    let next: number = this.points.findIndex((el) => el.id == id) + 1;
    let prev: number = this.points.findIndex((el) => el.id == id) - 1;
    let nextId: number | null = null;
    let prevId: number | null = null;
    while (next < this.points.length) {
      const point = this.points[next];
      if (point && point.isActive) {
        nextId = point.id;
        break;
      }
      next++;
    }

    while (prev >= 0) {
      const point = this.points[prev];
      if (point && point.isActive) {
        prevId = point.id;
        break;
      }
      prev--;
    }

    return { prevId: prevId, nextId: nextId };
  }

  switch(prev: number, next: number) {
    //prev, next == id
    const prevPoint = this.find(prev);
    const nextPoint = this.find(next);
    if (prevPoint!.isActive && !nextPoint!.isActive) {
      //code here
      prevPoint!.morphing = { state: "switch", progress: 0, targetId: next };
    }
  }

  deactivate(id: number) {
    const targetPoint = this.find(id);
    if (targetPoint && targetPoint.isActive) {
      const neighbors = this.getNeighbors(id);
      targetPoint.setNeighbors(neighbors);
      targetPoint.morphing = {
        state: "deactivate",
        progress: 0,
        targetId: null,
      };
    }
  }

  activate(id: number) {
    const targetPoint = this.find(id);
    if (targetPoint && !targetPoint.isActive) {
      const neighbor = this.getNeighbors(id);
      targetPoint.setNeighbors(neighbor);
      targetPoint.morphing = { state: "activate", progress: 0, targetId: null };
    }
  }

  find(id: number) {
    return this.points.find((el) => el.id == id);
  }

  updatePosition(handpose: Handpose) {
    if (this.morphing.state == "switching") {
      const targetPosition = this.positionSequence[
        this.morphing.targetId as number
      ](handpose, this.id);
      const currentPosition = this.positionSequence[this.currentSequenceId](
        handpose,
        this.id
      );
      const t = this.morphing.progress;
      this.position = {
        x: quadraticInOut(currentPosition.x, targetPosition.x, t),
        y: quadraticInOut(currentPosition.y, targetPosition.y, t),
      };
      this.morphing.progress += 0.02;
      if (this.morphing.progress > 1) {
        this.currentSequenceId = this.morphing.targetId as number;
        this.morphing = { state: null, progress: 0, targetId: null };
      }
    } else {
      this.position = this.positionSequence[this.currentSequenceId](
        handpose,
        this.id
      );
    }
  }

  update(handpose: Handpose) {
    this.updatePosition(handpose);
    this.displayPositions = [];
    for (const point of this.points) {
      point.update(handpose);
      if (point.morphing.state !== null) {
        let targetPosition;
        if (point.morphing.state == "switch") {
          targetPosition = this.find(point.morphing.targetId as number)!.pos;
        } else {
          if (
            point.neighbors.nextId == null ||
            point.neighbors.prevId == null
          ) {
            //null判定
            console.log("next: " + point.neighbors.nextId);
            console.log("prev: " + point.neighbors.prevId);
            console.log(this.points);
            if (point.neighbors.nextId) {
              //nextで消える / nextから生じる
              targetPosition = this.find(point.neighbors.nextId)!.pos;
            } else if (point.neighbors.prevId) {
              //prevで消える / prevから生じる
              targetPosition = this.find(point.neighbors.prevId)!.pos;
            } else {
              targetPosition = point.pos;
            } //いずれも存在しない
          } else {
            const nextPoint = this.find(point.neighbors.nextId);
            const prevPoint = this.find(point.neighbors.prevId);
            targetPosition = {
              x: (nextPoint!.pos.x + prevPoint!.pos.x) / 2,
              y: (nextPoint!.pos.y + prevPoint!.pos.y) / 2,
            };
          }
        }

        const t = point.morphing.progress;
        if (point.morphing.state == "deactivate") {
          this.displayPositions.push({
            id: point.id,
            pos: {
              x: spring(point.pos.x, targetPosition.x, t),
              y: spring(point.pos.y, targetPosition.y, t),
            },
            radius: 10 * (1 - t),
          });
        } else if (point.morphing.state == "switch") {
          this.displayPositions.push({
            id: point.id,
            pos: {
              x: spring(point.pos.x, targetPosition.x, t),
              y: spring(point.pos.y, targetPosition.y, t),
            },
            radius: 10,
          });
        } else {
          this.displayPositions.push({
            id: point.id,
            pos: {
              x: quadraticInOut(targetPosition.x, point.pos.x, t),
              y: quadraticInOut(targetPosition.y, point.pos.y, t),
            },
            radius: 10 * t,
          });
        }

        point.morphing.progress += 0.02;
        if (point.morphing.progress > 1) {
          point.morphing.progress = 0;
          if (
            point.morphing.state == "deactivate" ||
            point.morphing.state == "switch"
          ) {
            point.setActiveState(false);
            if (point.morphing.state == "switch") {
              this.find(point.morphing.targetId as number)!.setActiveState(
                true
              );
            }
          } else {
            point.setActiveState(true);
          }
          point.morphing.state = null;
        }
      } else if (point.isActive) {
        this.displayPositions.push({
          id: point.id,
          pos: point.pos,
          radius: 10,
        });
      }
    }
  }

  show(p5: p5Types) {
    p5.push();
    p5.translate(this.position.x, this.position.y);
    p5.translate(
      -this.displayPositions[0].pos.x,
      -this.displayPositions[0].pos.y
    );
    for (let i = 0; i < this.displayPositions.length; i++) {
      if (i < this.displayPositions.length - 1) {
        const start = this.displayPositions[i].pos;
        const end = this.displayPositions[i + 1].pos;
        p5.line(start.x, start.y, end.x, end.y);
      }
      p5.circle(
        this.displayPositions[i].pos.x,
        this.displayPositions[i].pos.y,
        this.displayPositions[i].radius
      );
    }
    p5.pop();
  }
}
