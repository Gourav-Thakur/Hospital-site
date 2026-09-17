import Reveal from "../Reveal";

const services = [
  { title: "Cataract Surgery", body: "Bladeless, stitch-free cataract removal with premium intraocular lenses.", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" },
  { title: "Glaucoma Care", body: "Early detection and long-term management to protect against vision loss.", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { title: "Comprehensive Eye Exams", body: "Detailed screenings for all ages using precise diagnostic equipment.", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.965 11.965 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { title: "Retina Treatment", body: "Care for diabetic retinopathy and other retinal conditions.", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { title: "Pediatric Eye Care", body: "Gentle, specialised eye care and screenings for children.", icon: "M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" },
  { title: "Refractive Correction", body: "Modern options to reduce dependence on glasses and contact lenses.", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" },
];

export default function Services() {
  return (
    <section id="services" className="py-20 md:py-32 bg-app">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl mb-14">
          <span className="inline-block px-4 py-2 bg-medical-mint text-medical-deepteal font-bold rounded-full text-sm tracking-wide uppercase">
            Our Services
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">
            Best in every <span className="text-medical-deepteal">angle of vision</span>
          </h2>
          <p className="mt-4 text-lg text-muted">
            From routine check-ups to advanced surgery, comprehensive eye care under one roof.
          </p>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.title} delay={(i % 3) * 100}>
              <div className="group h-full bg-surface rounded-3xl border border-app p-8 hover:border-medical-deepteal hover:shadow-xl transition-all duration-300">
                <div className="bg-medical-lightmint text-medical-deepteal w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-medical-deepteal group-hover:text-white transition-colors">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} /></svg>
                </div>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-muted leading-relaxed">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
