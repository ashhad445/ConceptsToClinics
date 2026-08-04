"use client";

import { Play, Sparkles, ArrowRight, Smartphone, Lock, Award, CheckCircle2 } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-[#F8F7F4]">
      {/* Soft Glow Background Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold shadow-sm">
              <Sparkles className="w-4 h-4 text-purple-700 animate-pulse" />
              <span>Private Online Medical & Biology Platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              Master Medical Science <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-indigo-600 to-slate-900">
                From First Principles
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              High-definition video lectures crafted by expert tutor <strong className="text-slate-900 font-bold">Aftab</strong>.
              Learn complex biological mechanisms, clinical correlations, and entry test concepts at your own pace through a secure, dedicated mobile experience.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm">
                <Lock className="w-3.5 h-3.5 text-purple-600" />
                <span>Encrypted HD Streaming</span>
              </div>
              <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm">
                <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                <span>Dedicated Android App</span>
              </div>
              <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tested Curriculum</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href="#contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-black hover:bg-slate-800 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                id="hero-enroll-btn"
              >
                <span>Get Access Code</span>
                <ArrowRight className="w-5 h-5" />
              </a>

              <a
                href="#demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 font-bold text-base shadow-sm transition-all duration-200"
                id="hero-watch-demo-btn"
              >
                <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
                <span>Watch Demo Lecture</span>
              </a>
            </div>

            {/* Micro Social Proof */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-4 border-t border-slate-200/80">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-extrabold flex items-center justify-center ring-2 ring-white">MA</div>
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white text-xs font-extrabold flex items-center justify-center ring-2 ring-white">TS</div>
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center ring-2 ring-white">AK</div>
              </div>
              <div className="text-xs text-slate-600 font-medium">
                <span className="text-slate-900 font-bold">100+ Enrolled Students</span> across medical entry prep & biological sciences.
              </div>
            </div>

          </div>

          {/* Right Visual Card Mockup */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Outer White Surface Card Container */}
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 relative z-10 space-y-6">
                
                {/* Header Badge Inside Card */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
                      🧬
                    </div>
                    <div>
                      <h4 className="text-slate-900 font-bold text-sm">Biology 101</h4>
                      <p className="text-xs text-slate-500 font-medium">Lecture 04: Cell Membrane Physiology</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                  </span>
                </div>

                {/* Simulated Video Player Screen */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 aspect-video group cursor-pointer shadow-md flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80"
                    alt="Lecture Preview"
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  
                  {/* Play Button Overlay */}
                  <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-6 h-6 fill-current ml-1" />
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-200">
                    <span className="font-semibold text-white">Chapter 2 · Fluid Mosaic Model</span>
                    <span className="bg-black/80 px-2 py-0.5 rounded-full text-[11px] font-mono">14:20 / 35:00</span>
                  </div>
                </div>

                {/* Progress Tracking Bar Simulation */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Student Progress</span>
                    <span className="text-purple-700 font-extrabold">75% Complete</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-black rounded-full w-[75%]" />
                  </div>
                </div>

                {/* Student Security Status */}
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <span className="text-slate-800 font-bold">Registered Device Active</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">ID: DEV-****-89A</span>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
