"use client";

import { useState } from "react";
import { Play, X, Shield, Clock, BookOpen, Sparkles } from "lucide-react";

export default function DemoVideo() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section id="demo" className="py-20 md:py-28 relative overflow-hidden bg-[#F8F7F4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200">
            <Sparkles className="w-4 h-4 text-purple-700" />
            <span>Sample Lecture Preview</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Experience The Teaching Methodology
          </h2>
          <p className="text-slate-600 text-base">
            Watch a free sample lecture below to see how complex physiological mechanisms are explained step-by-step.
          </p>
        </div>

        {/* Video Card Container */}
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200 p-3 sm:p-4 shadow-xl">
            
            {/* Thumbnail Poster */}
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 group">
              <img
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80"
                alt="Demo Lecture Preview"
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

              {/* Play Button Trigger */}
              <button
                onClick={() => setModalOpen(true)}
                className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-black text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300 border-2 border-white/40"
                aria-label="Play Sample Lecture"
                id="demo-play-btn"
              >
                <Play className="w-9 h-9 fill-current ml-1" />
              </button>

              {/* Video Overlay Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-white text-xs font-semibold border border-white/20 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-300" /> 12 Min Preview
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider">
                  Sample
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-sm">
                <div>
                  <h3 className="font-bold text-base sm:text-lg">Cell Membrane Transport Mechanisms</h3>
                  <p className="text-xs text-slate-300">Active vs Passive Transport & Ion Channels</p>
                </div>
              </div>
            </div>

            {/* Video Footer Info */}
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 mt-2 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-700" />
                <span>Full HD 1080p Stream Available in Mobile App</span>
              </div>
              <div className="flex items-center gap-2 text-purple-700 font-bold cursor-pointer hover:underline" onClick={() => setModalOpen(true)}>
                <BookOpen className="w-4 h-4" />
                <span>Watch Full Sample (12:30)</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Video Modal Popup */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">Sample Lecture Preview</span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-full bg-slate-100 text-slate-700 hover:text-black hover:bg-slate-200 transition-colors"
                id="demo-modal-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embedded YouTube / Video Container */}
            <div className="aspect-video w-full bg-black">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="Sample Biology Lecture"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Modal Footer CTA */}
            <div className="p-6 bg-[#F8F7F4] flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
              <div>
                <p className="text-slate-900 font-bold text-sm">Enjoying the teaching style?</p>
                <p className="text-xs text-slate-500">Get your unique signup code to unlock full course access.</p>
              </div>
              <a
                href="#contact"
                onClick={() => setModalOpen(false)}
                className="px-6 py-2.5 rounded-full bg-black text-white font-bold text-xs shadow-md"
              >
                Enroll In Full Course
              </a>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
