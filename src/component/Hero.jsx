import React from "react";

const Hero = () => {
  return (
    <div className="overflow-hidden">
      <video
        src={"assets/video/hero.mp4"}
        className="h-[48vh] min-h-80 w-full object-cover sm:h-[62vh] lg:h-[75vh]"
        autoPlay
        playsInline
        muted
        preload="auto"
        loop
      ></video>
    </div>
  );
};

export default Hero;
