
import { useNavigate } from "react-router-dom";
import { Box } from "lucide-react";

import backblaze from "../assets/backblaze.webp";
import CubbitDS3 from "../assets/CubbitDS3.webp";
import filebase from "../assets/filebase.webp";
import storj from "../assets/storj.webp";
import wasabai from "../assets/wasabai.webp";

function Hero() {
  const navigate = useNavigate();

  const orbitNode =
    "orbit-node absolute w-16 h-16 md:w-20 md:h-20 rounded-full " +
    "bg-[#1A1A1A] border border-[#333333] " +
    "flex items-center justify-center p-3 md:p-4 " +
    "shadow-[0_0_20px_rgba(183,245,66,0.08)] " +
    "transition-all duration-300 hover:border-[#B7F542]";

  const logoStyle =
    "w-full h-full object-contain";

  return (
    <section className="w-full bg-[#0A0A0A] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12">

          {/* Hero Content */}
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Storvex
              <br />
              <span className="text-[#B7F542]">
                Your Files. Distributed.
              </span>
              <br />
              Protected.
            </h1>

            <h2 className="mt-6 text-xl md:text-2xl font-semibold">
              Fault-Tolerant Multi-Cloud File Storage and Sharing
            </h2>

            <p className="mt-5 text-gray-400 text-base md:text-lg leading-relaxed max-w-2xl">
              Store, protect, and share your files with a secure
              distributed cloud storage platform built for reliability.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-4 mt-8">
              <button
                onClick={() => navigate("/upload")}
                className="px-7 py-4 bg-[#B7F542] text-black font-semibold rounded-lg hover:bg-[#A6E632] transition-all duration-300"
              >
                Upload File
              </button>

              <button
                onClick={() => navigate("/dashboard")}
                className="px-7 py-4 bg-[#B7F542] text-black font-semibold rounded-lg hover:bg-[#A6E632] transition-all duration-300"
              >
                Dashboard
              </button>
            </div>
          </div>

          {/* Distributed Storage Animation */}
          <div className="flex items-center justify-center">
            <div className="relative w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] md:w-[420px] md:h-[420px]">

              {/* Orbit Circle */}
              <div className="absolute inset-[12%] rounded-full border-2 border-dashed border-[#333333]" />

              {/* Central Storvex Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center text-[#B7F542]">
                  <Box
                    size={120}
                    strokeWidth={1.5}
                    className="drop-shadow-[0_0_15px_#B7F542]"
                  />
                </div>
              </div>

              {/* Orbiting Cloud Providers */}
              <div className="absolute inset-0 orbit-animation">

                {/* Backblaze */}
                <div
                  className={`${orbitNode} top-[12%] left-1/2 -translate-x-1/2`}
                >
                  <img
                    src={backblaze}
                    alt="Backblaze"
                    className={logoStyle}
                  />
                </div>

                {/* Cubbit DS3 */}
                <div
                  className={`${orbitNode} top-1/2 left-[12%] -translate-y-1/2`}
                >
                  <img
                    src={CubbitDS3}
                    alt="Cubbit DS3"
                    className={logoStyle}
                  />
                </div>

                {/* Filebase */}
                <div
                  className={`${orbitNode} top-1/2 right-[12%] -translate-y-1/2`}
                >
                  <img
                    src={filebase}
                    alt="Filebase"
                    className={logoStyle}
                  />
                </div>

                {/* Storj */}
                <div
                  className={`${orbitNode} bottom-[12%] left-[22%]`}
                >
                  <img
                    src={storj}
                    alt="Storj"
                    className={logoStyle}
                  />
                </div>

                {/* Wasabi */}
                <div
                  className={`${orbitNode} bottom-[12%] right-[22%]`}
                >
                  <img
                    src={wasabai}
                    alt="Wasabi"
                    className={logoStyle}
                  />
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Hero;
