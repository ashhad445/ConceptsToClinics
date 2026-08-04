"use client";

import { UserCheck, Stethoscope, CheckCircle } from "lucide-react";

export default function About() {
  const highlights = [
    "First-principles breakdown of complex biological pathways",
    "Clinical correlation with real-world medical case studies",
    "Tailored preparation for pre-medical entry tests (MDCAT / MCAT)",
    "Direct tutor support for code-verified registered students",
  ];

  return (
    <section id="about" className="py-20 md:py-28 relative bg-[#F8F7F4] border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Tutor Photo & Badge Mockup */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md">
              
              {/* Decorative Backdrop */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-200 to-amber-200 rounded-3xl transform rotate-3 scale-105 opacity-40 blur-xl" />

              {/* Main Photo Card */}
              <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=800&q=80"
                  alt="Aftab - Medical & Biology Educator"
                  className="w-full h-[420px] object-cover object-top"
                />
                
                {/* Image Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 flex items-center justify-between shadow-md">
                  <div>
                    <h3 className="text-slate-900 font-bold text-lg">Aftab</h3>
                    <p className="text-purple-700 text-xs font-bold">Lead Educator & Tutor</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Bio & Details */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200">
              <UserCheck className="w-4 h-4" />
              <span>Meet Your Instructor</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Deconstructing Medicine & Biology With <span className="text-purple-700">Conceptual Clarity</span>
            </h2>

            <p className="text-slate-600 text-base leading-relaxed font-normal">
              Teaching biology is not about memorizing textbook definitions. It’s about building a robust mental framework of how living systems function, adapt, and fail.
            </p>

            <p className="text-slate-600 text-sm leading-relaxed">
              With years of experience guiding pre-medical aspirants and university students, I developed the <strong className="text-slate-900">ConceptsToClinics</strong> curriculum to bridge foundational cell biology with actual clinical application.
            </p>

            {/* Highlights List */}
            <div className="space-y-3 pt-2">
              {highlights.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm text-slate-800 font-medium">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Metrics Counter Grid */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 text-center shadow-sm">
                <div className="text-2xl font-black text-slate-900">5+</div>
                <div className="text-xs text-slate-500 font-semibold mt-1">Years Teaching</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-200 text-center shadow-sm">
                <div className="text-2xl font-black text-purple-700">100+</div>
                <div className="text-xs text-slate-500 font-semibold mt-1">Active Students</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-200 text-center shadow-sm">
                <div className="text-2xl font-black text-emerald-600">100%</div>
                <div className="text-xs text-slate-500 font-semibold mt-1">HD Video Access</div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
