"use client";

import { useState } from "react";
import Reveal from "../Reveal";

type Branch = {
  id: string;
  name: string;
  subtitle: string;
  address: string;
  phone: string;
  hours: string;
  coords: string; // "lat,lng"
};

// NOTE: Chiraundi currently reuses the Bariatu Rd coordinates as a placeholder.
// Replace `coords` for branch2 with the real Chiraundi location when available.
const branches: Branch[] = [
  {
    id: "branch1",
    name: "Bariatu Rd Branch",
    subtitle: "Main Hospital",
    address: "Bariatu Rd, opposite RPS Hospital, Sarhul Nagar, Ranchi, Jharkhand 834009",
    phone: "+91 98765 43210",
    hours: "Mon - Sat: 9:00 AM - 8:00 PM",
    coords: "23.388768,85.329953",
  },
  {
    id: "branch2",
    name: "Chiraundi Branch",
    subtitle: "Diagnostic Center",
    address: "Chiraundi, Morabadi, Boreya, Ranchi, Jharkhand 834006",
    phone: "+91 98765 00000",
    hours: "Mon - Sun: 10:00 AM - 6:00 PM",
    coords: "23.388768,85.329953",
  },
];

export default function Locations() {
  const [active, setActive] = useState(branches[0].id);
  const branch = branches.find((b) => b.id === active)!;

  return (
    <section id="locations" className="py-20 md:py-32 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Our <span className="text-medical-deepteal">Locations</span>
          </h2>
          <p className="text-xl text-muted">Find a Vision House branch near you in Ranchi.</p>
        </Reveal>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="lg:w-1/4 flex flex-row lg:flex-col gap-3 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
            {branches.map((b) => {
              const isActive = b.id === active;
              return (
                <button
                  key={b.id}
                  onClick={() => setActive(b.id)}
                  className={`flex-shrink-0 text-left px-6 py-6 rounded-2xl border bg-surface transition-all w-64 lg:w-full relative overflow-hidden ${
                    isActive ? "border-medical-deepteal shadow-lg" : "border-app hover:border-medical-deepteal"
                  }`}
                >
                  <span className={`absolute left-0 top-0 w-1.5 h-full bg-medical-deepteal rounded-l-2xl transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`} />
                  <span className="block text-xl font-bold mb-1">{b.name.replace(" Branch", "")}</span>
                  <span className="block text-sm text-muted font-medium">{b.subtitle}</span>
                </button>
              );
            })}
          </div>

          <div className="lg:w-3/4 bg-app rounded-3xl border border-app p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8 h-full">
              <div className="w-full md:w-3/5 h-64 md:h-[400px] bg-app rounded-2xl overflow-hidden shadow-inner">
                <iframe
                  key={branch.id}
                  title={`Map of ${branch.name}`}
                  src={`https://maps.google.com/maps?q=${branch.coords}&z=16&output=embed`}
                  className="w-full h-full"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
              <div className="w-full md:w-2/5 flex flex-col justify-center space-y-8">
                <div>
                  <h3 className="text-3xl font-bold mb-4">{branch.name}</h3>
                  <div className="flex items-start gap-4">
                    <div className="bg-medical-mint p-2 rounded-lg text-medical-deepteal shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <p className="text-lg leading-relaxed mt-1 text-muted">{branch.address}</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${branch.coords}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 bg-medical-deepteal hover:bg-teal-800 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-md hover:shadow-lg w-fit"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                    Get Directions
                  </a>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 font-semibold">
                    <div className="bg-app p-2 rounded-lg text-muted shrink-0 border border-app">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </div>
                    <span>{branch.phone}</span>
                  </div>
                  <div className="flex items-center gap-4 font-semibold">
                    <div className="bg-app p-2 rounded-lg text-muted shrink-0 border border-app">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <span>{branch.hours}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
