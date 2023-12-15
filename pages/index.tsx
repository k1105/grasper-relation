import { useCallback, useRef, useState, useEffect } from "react";
import "@tensorflow/tfjs";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import Webcam from "react-webcam";
import { HandSketch } from "../sketch/HandSketch";
import { PixelInput } from "@tensorflow-models/hand-pose-detection/dist/shared/calculators/interfaces/common_interfaces";
import Head from "next/head";
import { Cormorant_Garamond } from "next/font/google";
import { calcKeypointsTotalDistance } from "../lib/calculator/calcKeypointsTotalDistance";
import Image from "next/image";

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
  const isLost = useRef<boolean>(true);
  const sketchContainerRef = useRef<HTMLDivElement>(null);
  // const titleRef = useRef<HTMLDivElement>(null);
  const instructionRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const noUser = useRef<boolean>(true);
  const [innerWidth, setInnerWidth] = useState<number>(0);
  const [innerHeight, setInnerHeight] = useState<number>(0);

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
            const res = calcKeypointsTotalDistance(hand.keypoints);
            const lower = 260;
            const upper = 1200;
            // カメラから離れた場合にロスト判定する。
            //閾値はチューニング用のサイト(https://grasper-threshold-checker.vercel.app/)で計測（23/10/29時点での設営）したものを使用。
            let status = false;
            if (lower < res && res < upper) {
              status = true;
              messageRef.current!.style.opacity = "0";
            } else if (upper < res) {
              messageRef.current!.style.opacity = "1";
              sketchContainerRef.current!.style.filter = "blur(10px)";
            }
            return hand.score > 0.75 && status;
          })
        ) {
          predictionsRef.current = predictions;
          lostCountRef.current = 0;
          instructionRef.current!.style.opacity = "0";
          // titleRef.current!.style.opacity = "0";
          lostAt.current = Date.now();
          isLost.current = false;
          sketchContainerRef.current!.style.filter = "blur(0px)";
          noUser.current = false;
        } else {
          lostCountRef.current++;
          isLost.current = true;
        }

        if (lostCountRef.current > 5) {
          predictionsRef.current = [];
        }

        if (lostCountRef.current > 100) {
          sketchContainerRef.current!.style.filter = "blur(10px)";
          instructionRef.current!.style.opacity = "1";
          // titleRef.current!.style.opacity = "1";
        }

        if (lostAt.current !== 0) {
          if (noUser.current) {
            if (Date.now() - lostAt.current > 10 * 60 * 1000) {
              location.reload();
            }
          } else {
            if (Date.now() - lostAt.current > 10 * 1000) {
              location.reload();
            }
          }
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
    setInnerWidth(window.innerWidth);
    setInnerHeight(window.innerHeight);
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

      {/* <div
        ref={titleRef}
        className={garamond400.className}
        style={{
          position: "absolute",
          fontSize: "4rem",
          top: "0",
          width: "100vw",
          lineHeight: "100vh",
          textAlign: "center",
          transition: "all 2s ease 3s",
          opacity: "1",
        }}
      >
        Relation
      </div> */}

      <div
        ref={instructionRef}
        style={{
          position: "absolute",
          top: "0",
          width: "100vw",
          lineHeight: "100vh",
          textAlign: "center",
          transition: "all 1s ease",
          opacity: "1",
        }}
      >
        <Image
          src="/img/instruction.png"
          width={800}
          height={800}
          style={{ marginTop: "100px" }}
          alt="手前の台に手を近づけると、体験が始まります。"
        ></Image>
        <div
          style={{
            position: "absolute",
            right: 0,
            top: -innerWidth / 4,
            zIndex: -1,
            opacity: 0.3,
          }}
        >
          <Webcam //手指の動きを取得するのに必要なカメラ映像
            width={innerWidth}
            height={innerWidth}
            mirrored
            id="webcam"
            audio={false}
            screenshotFormat="image/jpeg"
          />
        </div>
      </div>
      <div
        ref={messageRef}
        style={{
          position: "absolute",
          top: "0",
          width: "100vw",
          lineHeight: "100vh",
          textAlign: "center",
          transition: "all 1s ease",
          opacity: "0",
        }}
      >
        <Image
          src="/img/caution_close.png"
          width={800}
          height={800}
          style={{ marginTop: "100px" }}
          alt="手が近すぎます。"
        ></Image>
      </div>

      {ready && (
        <>
          <div
            ref={sketchContainerRef}
            style={{ transition: "all 1500ms ease", filter: "blur(0px)" }}
          >
            <HandSketch handpose={predictionsRef} isLost={isLost} />
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
