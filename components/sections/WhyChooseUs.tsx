import Reveal from "../Reveal";

const pillars = [
  {
    title: "Modern Instruments",
    body: "State-of-the-art diagnostic and surgical technology for precise, safe, and comfortable treatment.",
    icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
  {
    title: "Trusted Diagnostics",
    body: "Thorough, accurate eye evaluations so every diagnosis and treatment plan is built on solid ground.",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.965 11.965 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    title: "Expert Support",
    body: "A patient-first team guiding you through every step of your journey — from screening to recovery.",
    icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z",
  },
];

export default function WhyChooseUs() {
  return (
    <section id="why" className="py-20 md:py-28 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block px-4 py-2 bg-medical-mint text-medical-deepteal font-bold rounded-full text-sm tracking-wide uppercase">
            Why Choose Us
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">
            Care you can <span className="text-medical-deepteal">trust</span>
          </h2>
          <p className="mt-4 text-lg text-muted">
            Every visit is backed by modern technology, precise diagnostics, and a team that puts your sight first.
          </p>
        </Reveal>

        <div className="grid gap-8 md:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 120}>
              <div className="h-full bg-app rounded-3xl border border-app p-8 hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
                <div className="bg-medical-lightmint text-medical-deepteal w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={p.icon} /></svg>
                </div>
                <h3 className="text-xl font-bold mb-3">{p.title}</h3>
                <p className="text-muted leading-relaxed">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
