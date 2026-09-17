"use client";

import { useEffect, useState } from "react";

const slides = [
  { src: "/imgs/cabin.png", alt: "Vision House consultation cabin" },
  { src: "/imgs/reception.png", alt: "Vision House reception" },
  { src: "/imgs/building.png", alt: "Vision House hospital building" },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="home" className="relative mt-20 h-[62vh] md:h-[calc(100vh-5rem)] min-h-[520px] w-full overflow-hidden bg-medical-darkslate">
      <div className="relative w-full h-full bg-medical-deepteal">
        {slides.map((s, i) => (
          <div
            key={s.src}
            className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
            style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 20 : 10 }}
          >
            <img
              src={s.src}
              alt={s.alt}
              className="object-cover w-full h-full opacity-60 mix-blend-overlay"
              style={{
                transform: i === current ? "scale(1.08)" : "scale(1)",
                transition: "transform 7s linear",
              }}
            />
          </div>
        ))}
      </div>

      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-4 bg-gradient-to-b from-black/40 via-transparent to-black/60">
        <p className="text-medical-mint font-semibold tracking-[0.2em] uppercase text-sm md:text-base mb-4 animate-fade-up">
          Ranchi&apos;s Trusted Eye Care
        </p>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight drop-shadow-2xl animate-fade-up" style={{ animationDelay: "120ms" }}>
          Clear Vision,<br className="md:hidden" /> Better Life.
        </h1>
        <p className="mt-6 max-w-2xl text-white/85 text-lg md:text-xl animate-fade-up" style={{ animationDelay: "240ms" }}>
          Advanced, compassionate eye care led by Dr. R.K Thakur — bringing 20+ years of surgical expertise to every patient.
        </p>
      </div>

      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-30">
        <svg className="relative block w-full h-[50px] md:h-[80px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" className="fill-app" />
        </svg>
      </div>
    </section>
  );
}
