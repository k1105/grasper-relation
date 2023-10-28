import { useCallback, useRef, useState, useEffect } from "react";
import "@tensorflow/tfjs";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import Webcam from "react-webcam";
import { HandSketch } from "../sketch/HandSketch";
import { PixelInput } from "@tensorflow-models/hand-pose-detection/dist/shared/calculators/interfaces/common_interfaces";
import Head from "next/head";
import { Cormorant_Garamond } from "next/font/google";
import { calcKeypointsTotalDistance } from "../lib/calculator/calcKeypointsTotalDistance";

// If loading a variable font, you don't need to specify the font weight
const garamond400 = Cormorant_Garamond({
  subsets: ["latin"],
  weight: "400",
});

export default function App() {
  const webcamRef = useRef<Webcam>(null);
  const modelRef = useRef<null | handPoseDetection.HandDetector>(null);
  const predictionsRef = useRef<handPoseDetection.Hand[]>([]);
  const requestRef = useRef<null | number>(null);
  const [ready, setReady] = useState<boolean>(false);
  const lostCountRef = useRef(0);
  const lostAt = useRef(0);
  const sketchContainerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  // const timer = 120000;

  const capture = useCallback(async () => {
    if (typeof webcamRef.current && modelRef.current) {
      //webcamとmodelのインスタンスが生成されていたら
      const predictions = await modelRef.current.estimateHands(
        (webcamRef.current as Webcam).getCanvas() as PixelInput
      ); //webcamの現時点でのフレームを取得し、ポーズ推定の結果をpredictionsに非同期で格納

      if (predictions) {
        if (
          predictions.length > 0 &&
          predictions.every((hand) => {
            return (
              hand.score > 0.75 &&
              calcKeypointsTotalDistance(hand.keypoints) > 260 // カメラから離れた場合にロスト判定する。
              //閾値はチューニング用のサイト(https://grasper-threshold-checker.vercel.app/)で計測（23/10/29時点での設営）したものを使用。
            );
          })
        ) {
          predictionsRef.current = predictions;
          lostCountRef.current = 0;
          titleRef.current!.style.opacity = "0";
          lostAt.current = Date.now();
          sketchContainerRef.current!.style.filter = "blur(0px)";
        } else {
          lostCountRef.current++;
        }

        if (lostCountRef.current > 5) {
          predictionsRef.current = [];
        }

        if (lostCountRef.current > 100) {
          sketchContainerRef.current!.style.filter = "blur(10px)";
          titleRef.current!.style.opacity = "1";
        }

        if (
          lostAt.current !== 0 &&
          Date.now() - lostAt.current > 2 * 60 * 1000
        ) {
          location.reload();
        }
      }
    }

    if (ready) {
      requestRef.current = requestAnimationFrame(capture); //captureを実施
    }
  }, [ready]);

  useEffect(() => {
    const load = async () => {
      const model = handPoseDetection.SupportedModels.MediaPipeHands;
      lostAt.current = Date.now();
      const detectorConfig = {
        runtime: "tfjs",
        modelType: "full",
      } as handPoseDetection.MediaPipeHandsTfjsModelConfig;
      modelRef.current = await handPoseDetection.createDetector(
        model,
        detectorConfig
      );
    };

    load();

    setReady(true);
    // setInterval("location.reload()", timer);
  }, []);

  useEffect(() => {
    if (ready) {
      requestRef.current = requestAnimationFrame(capture);
    }
  }, [capture, ready]);

  return (
    <>
      <Head>
        <title>Grasp(er) - relation</title>
        <meta name="description" content="" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div
        ref={titleRef}
        className={garamond400.className}
        style={{
          position: "absolute",
          fontSize: "4rem",
          top: "0",
          width: "100vw",
          lineHeight: "100vh",
          textAlign: "center",
          transition: "all 2s ease 5s",
          opacity: "1",
        }}
      >
        Relation
      </div>

      {ready && (
        <>
          <div
            ref={sketchContainerRef}
            style={{ transition: "all 1000ms ease", filter: "blur(0px)" }}
          >
            <HandSketch handpose={predictionsRef} />
          </div>
        </>
      )}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          opacity: 0, //debug -> opacity: 1
        }}
      >
        <Webcam //手指の動きを取得するのに必要なカメラ映像
          width="400"
          height="300"
          mirrored
          id="webcam"
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
        />
      </div>
    </>
  );
}
