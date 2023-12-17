import Webcam from "react-webcam";
import Image from "next/image";
import { MutableRefObject, useState } from "react";

type Props = {
  noUser: MutableRefObject<boolean>;
};

export const ScreenSaver = ({ noUser }: Props) => {
  const [switcher, setSwitcher] = useState<number>(0);
  setInterval(() => {
    if (noUser.current) {
      setSwitcher((switcher + 1) % 2);
    }
  }, 2 * 60 * 1000);
  return (
    <>
      {/* 
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
          transition: "all 2s ease 3s",
          opacity: "1",
        }}
      >
        Familiar / Strange
      </div> */}
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
          top: 0,
          zIndex: -1,
        }}
      >
        {switcher == 0 ? (
          <iframe
            src="https://www.youtube.com/embed/FSAat-dstbQ?autoplay=1&mute=1"
            title="YouTube video player"
            style={{
              border: 0,
              width: "100vw",
              height: "100vh",
              opacity: 0.5,
            }}
          ></iframe>
        ) : (
          <Webcam //手指の動きを取得するのに必要なカメラ映像
            mirrored
            id="webcam"
            audio={false}
            screenshotFormat="image/jpeg"
            style={{
              marginTop: -innerWidth / 4,
              opacity: 0.3,
              width: "100vw",
              height: "100vw",
            }}
          />
        )}
      </div>
    </>
  );
};
