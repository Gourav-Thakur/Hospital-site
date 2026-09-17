import Reveal from "../Reveal";

export default function AboutDoctor() {
  return (
    <section id="about" className="py-20 md:py-32 bg-app">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-12 lg:gap-20">
          <Reveal className="lg:w-1/2 space-y-6">
            <div className="inline-block px-4 py-2 bg-medical-mint text-medical-deepteal font-bold rounded-full text-sm tracking-wide uppercase">
              Lead Specialist
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              About <span className="text-medical-deepteal">The Doctor</span>
            </h2>
            <p className="text-xl md:text-2xl font-semibold leading-snug pt-4 border-t-2 border-app">
              Dr. R.K Thakur is a highly acclaimed ophthalmologist with a specialized focus on anterior
              segment surgery and comprehensive eye care.
            </p>
            <div className="text-muted text-lg leading-relaxed space-y-4">
              <p>
                With over <strong className="text-app">20 years of clinical and surgical experience</strong>,
                Dr. Thakur has successfully performed more than 15,000 cataract surgeries and numerous complex
                glaucoma procedures. He is dedicated to utilizing the latest advancements in medical technology
                to preserve and restore sight.
              </p>
              <p>
                His patient-first approach has made Vision House a trusted name across Ranchi. He continually
                leads community outreach programs to ensure accessible eye screenings for all.
              </p>
            </div>
          </Reveal>

          <Reveal className="lg:w-1/2 flex justify-center lg:justify-end w-full" delay={120}>
            <div className="relative w-72 h-[400px] md:w-[400px] md:h-[500px] group">
              <div className="absolute -inset-4 border-2 border-medical-mint rounded-3xl z-0 transform group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute -inset-4 border-2 border-medical-deepteal/20 rounded-3xl z-0 transform translate-x-4 translate-y-4" />
              <img src="/imgs/Doctor_image.png" alt="Dr. R.K Thakur" className="absolute inset-0 w-full h-full object-cover rounded-2xl shadow-2xl z-10" />
              <div className="absolute -bottom-6 -left-6 z-20 bg-surface p-6 rounded-2xl shadow-xl border border-app flex items-center gap-4 group-hover:-translate-y-2 transition-transform duration-500">
                <div className="bg-medical-lightmint p-3 rounded-full text-medical-deepteal">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.965 11.965 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div>
                  <span className="block text-2xl font-black text-app">20+</span>
                  <span className="text-sm font-semibold text-muted uppercase tracking-wider">Years Exp.</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
