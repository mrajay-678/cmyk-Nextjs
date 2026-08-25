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
      <div
        className="bg-black text-white p-4 w-full shadow-xl h-full"
        style={{
          backgroundImage:
            "url('https://cmykprint.shop/wp-content/uploads/2025/11/Frame-1.png.webp')",
        }}
      ></div>
    </div>
  );
};

export default Hero;
