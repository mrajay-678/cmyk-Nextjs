"use client"
import { useState, useEffect } from 'react'

export default function TypeWriter({ appendClass, prefix }) {
    const hats = [
  {
    prep: 'a',
    suffix: 'occasions.'
  },
  {
    prep: 'a',
    suffix: 'impact.'
  },
  {
    prep: 'a',
    suffix: 'life.'
  },
]; 
    let className = "flex flex-col gap-4";
    if (appendClass) className += " " + appendClass;

    // Typewriter effect base class
    const typeWriterClass = "font-bold pr-1 text-center sm:text-start text-[#F6C520] "
        + "animate-cursor overflow-hidden whitespace-normal sm:whitespace-nowrap transition-[width] ease-in-out duration-2000";

    // State of current hat index
    const [currentHat, setCurrentHat] = useState(0);
    // State to toggle word collapse effect
    const [collapseClass, setCollapseClass] = useState(" w-0");

    useEffect(() => {
        setTimeout(() => setCollapseClass("w-full"), 100);

        const incrementHat = async () => {
            // Set the width to 0 - transition duration is 1000ms
            setCollapseClass(" w-0");
            setTimeout(() => {
                /**
                 * After 1100ms, change the displayed text while the div
                 * is collapsed by incrementing the index
                 */
                setCurrentHat(oldVal => {
                    let hatIndex;
                    if (oldVal >= hats.length - 1) {
                        hatIndex = 0;
                    } else {
                        hatIndex = oldVal + 1;
                    }

                    return hatIndex;
                });
            }, 1100);
            // After 1000ms, set width to 100% - transition duration is 1000ms
            setTimeout(() => {
                setCollapseClass("w-full");
            }, 1000);
        }
        // Interval timer to change text every 4000ms
        const id = setInterval(incrementHat, 4000);

        // Cleanup interval timer
        return () => clearInterval(id);
    }, []); //  eslint-disable-line react-hooks/exhaustive-deps

    return (
        <section className='overflow-hidden max-w-screen'>
            <div className="bg-[url('https://cmykprint.shop/wp-content/uploads/2025/11/Frame-1.png.webp')] max-w-screen h-8"></div>
                <div className="bg-[url('https://cmykprint.shop/wp-content/uploads/2025/11/Group-13-scaled.png.webp')] bg-center px-6 py-24 sm:py-32 md:py-44">
                    <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-3 text-center text-4xl sm:flex-row sm:gap-6 sm:text-5xl md:text-6xl">
                        <span className="font-bold text-white">Made for real</span>
                        <div className='min-h-[1.1em]'>
                            <div className={`${typeWriterClass} ${collapseClass}`}>{hats[currentHat].suffix}</div>
                        </div>
                    </div>
                </div>
            <div className="bg-[url('https://cmykprint.shop/wp-content/uploads/2025/11/Frame-1.png.webp')] max-w-screen h-8"></div>
        </section>
    )
}
