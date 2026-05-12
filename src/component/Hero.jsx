import React from "react"

const Hero = () => {
	return (
		<div className="overflow-hidden">
			<video src={"https://www.pexels.com/download/video/32434954/"} className="h-[48vh] min-h-[320px] w-full object-cover sm:h-[62vh] lg:h-[75vh]" autoPlay playsInline muted preload="auto" loop></video>
		</div>
	)
}

export default Hero
