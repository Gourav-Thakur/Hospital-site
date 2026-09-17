import Reveal from "../Reveal";

const stats = [
  { value: "20+", label: "Years of Experience" },
  { value: "15,000+", label: "Cataract Surgeries" },
  { value: "50,000+", label: "Happy Patients" },
  { value: "2", label: "Branches in Ranchi" },
];

// Parallax-style band: fixed background attachment gives a subtle depth effect on scroll.
export default function Stats() {
  return (
    <section
      className="relative py-20 md:py-24 bg-medical-deepteal bg-fixed"
      style={{
        backgroundImage:
          "linear-gradient(rgba(15,118,110,0.92), rgba(15,118,110,0.92)), url('/imgs/building.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 100}>
              <div className="text-white">
                <div className="text-4xl md:text-5xl font-black tracking-tight">{s.value}</div>
                <div className="mt-2 text-sm md:text-base font-semibold text-medical-mint uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
