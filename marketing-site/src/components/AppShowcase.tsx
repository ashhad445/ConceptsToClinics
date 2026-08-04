"use client";

import { Smartphone, ShieldAlert, CheckCircle, BarChart3, Lock, Zap } from "lucide-react";

export default function AppShowcase() {
  const appFeatures = [
    {
      icon: ShieldAlert,
      title: "Anti-Piracy Screen Protection",
      description: "Automatic screen-capture & recording block (FLAG_SECURE) to prevent content theft and safeguard video lectures.",
    },
    {
      icon: Lock,
      title: "Single Device Binding",
      description: "Your student account is securely bound to your primary phone on first login, ensuring private access.",
    },
    {
      icon: BarChart3,
      title: "Automatic Progress Checkmarks",
      description: "Tracks your exact watch percentage per lecture with completion checkmarks and automatic video resume position.",
    },
    {
      icon: Zap,
      title: "Optimized HD Playback",
      description: "Buffer-free Vimeo video streaming optimized for low-bandwidth mobile networks without quality loss.",
    },
  ];

  return (
    <section id="app-features" className="py-20 md:py-28 relative bg-[#F8F7F4] border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Feature Description */}
          <div className="lg:col-span-6 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200">
              <Smartphone className="w-4 h-4 text-purple-700" />
              <span>Dedicated Android App</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Designed Exclusively For Focused Mobile Learning
            </h2>

            <p className="text-slate-600 text-base leading-relaxed">
              No distracting social feeds or web notifications. Students watch lectures inside a dedicated, lightweight Android app engineered for high-performance video study.
            </p>

            {/* Feature List */}
            <div className="grid sm:grid-cols-2 gap-6 pt-2">
              {appFeatures.map((f, idx) => {
                const Icon = f.icon;
                return (
                  <div key={idx} className="space-y-2 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="text-slate-900 font-bold text-sm">{f.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed font-medium">{f.description}</p>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Right Phone Mockup Container */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-sm">
              
              {/* Decorative Glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-200 to-amber-200 rounded-[50px] blur-2xl opacity-50 transform scale-95" />

              {/* Phone Frame */}
              <div className="relative rounded-[45px] p-4 bg-slate-900 border-4 border-slate-800 shadow-2xl space-y-4">
                
                {/* Phone Speaker Notch */}
                <div className="w-28 h-4 bg-black rounded-full mx-auto mb-2 flex items-center justify-center">
                  <div className="w-8 h-1 bg-slate-800 rounded-full" />
                </div>

                {/* Simulated Neumorphic Light Cream App Screen */}
                <div className="rounded-[32px] bg-[#F8F7F4] border border-slate-200 p-4 space-y-4 text-slate-900">
                  
                  {/* App Header Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🎓</span>
                      <span className="font-extrabold text-sm text-slate-900">Concepts Play</span>
                    </div>
                    <span className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">A</span>
                  </div>

                  {/* Course Card Inside Phone */}
                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200 space-y-3 shadow-sm">
                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <h4 className="font-bold text-slate-900">Biology 101</h4>
                        <p className="text-[11px] text-slate-500 font-medium">Enrolled · 24 Lectures</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-bold">ACTIVE</span>
                    </div>

                    {/* Progress Bar inside phone */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-600 font-medium">
                        <span>Course Progress</span>
                        <span className="text-emerald-600 font-bold">18 / 24 Done</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-black rounded-full w-[75%]" />
                      </div>
                    </div>
                  </div>

                  {/* Lecture Items List in Phone */}
                  <div className="space-y-2 text-xs font-medium">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span className="text-slate-900 font-semibold">01. Cell Membrane Physiology</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">14m</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span className="text-slate-900 font-semibold">02. Active Transport & ATP</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">22m</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black text-white flex items-center justify-between shadow-md">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="font-bold">03. Ion Channels & Potential</span>
                      </div>
                      <span className="text-[10px] text-slate-300 font-mono">Resume 08:40</span>
                    </div>
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
