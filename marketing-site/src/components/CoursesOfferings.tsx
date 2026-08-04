"use client";

import { BookOpen, Check, ArrowRight, ShieldCheck, Video, FileText } from "lucide-react";

export default function CoursesOfferings() {
  const courses = [
    {
      id: "bio101",
      title: "Biology 101: Core Principles",
      badge: "Most Popular",
      description:
        "Comprehensive foundational course covering cell biology, genetics, membrane transport, and bioenergetics for pre-medical students.",
      lecturesCount: 24,
      duration: "18 Hours Total",
      features: [
        "24 High-Definition Lectures",
        "Cellular & Molecular Biology Focus",
        "Interactive Progress Checkmarks",
        "Dedicated Mobile App Access",
        "Code-Gated Anti-Piracy Security",
      ],
      popular: true,
    },
    {
      id: "physio",
      title: "Human Physiology & Anatomy",
      badge: "Advanced",
      description:
        "In-depth analysis of cardiovascular, nervous, renal, and endocrine organ systems with clinical case studies.",
      lecturesCount: 32,
      duration: "26 Hours Total",
      features: [
        "32 Detailed System Lectures",
        "Clinical Correlations & Pathophysiology",
        "Diagrammatic Step-by-Step Breakdown",
        "Mobile HD Video Playback",
        "One-on-One Tutor Query Clearance",
      ],
      popular: false,
    },
    {
      id: "entry-prep",
      title: "Medical Entry Test Crash Prep",
      badge: "Intensive",
      description:
        "High-yield targeted review designed to maximize entry test scores through past paper breakdown and rapid conceptual drills.",
      lecturesCount: 20,
      duration: "15 Hours Total",
      features: [
        "20 High-Yield Exam Modules",
        "Multiple-Choice Question Strategies",
        "Time-Management Frameworks",
        "Android App Mobile Streaming",
        "Complete Lecture Checkmarks",
      ],
      popular: false,
    },
  ];

  return (
    <section id="courses" className="py-20 md:py-28 relative bg-[#F8F7F4] border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200">
            <BookOpen className="w-4 h-4 text-purple-700" />
            <span>Curriculum & Catalog</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Curated Courses Built For Results
          </h2>
          <p className="text-slate-600 text-base">
            Enrolled students receive a unique single-use code granting access to their specific course bundle inside the mobile app.
          </p>
        </div>

        {/* Course Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((c) => (
            <div
              key={c.id}
              className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 bg-white border ${
                c.popular
                  ? "border-purple-300 shadow-2xl ring-2 ring-purple-500/20"
                  : "border-slate-200 shadow-lg hover:shadow-xl"
              }`}
            >
              {/* Badge */}
              {c.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-black text-white text-xs font-extrabold shadow-md uppercase tracking-wider">
                  {c.badge}
                </div>
              )}

              <div className="space-y-6">
                {!c.popular && (
                  <span className="inline-block px-3.5 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
                    {c.badge}
                  </span>
                )}

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-2">{c.title}</h3>
                  <p className="text-slate-600 text-xs leading-relaxed">{c.description}</p>
                </div>

                <div className="flex items-center gap-4 py-3 border-y border-slate-100 text-xs text-slate-700 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-purple-700" />
                    <span>{c.lecturesCount} Lectures</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>{c.duration}</span>
                  </div>
                </div>

                {/* Feature Checklist */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Included Features:</span>
                  {c.features.map((f, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 font-medium">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer & Action */}
              <div className="pt-8 mt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Access Format</span>
                  <span className="text-purple-700 font-bold">Android App Stream</span>
                </div>

                <a
                  href="#contact"
                  className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full font-bold text-sm transition-all duration-200 ${
                    c.popular
                      ? "bg-black hover:bg-slate-800 text-white shadow-md"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200"
                  }`}
                  id={`course-enroll-btn-${c.id}`}
                >
                  <span>Request Signup Code</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

            </div>
          ))}
        </div>

        {/* Manual Payment Explanation Banner */}
        <div className="mt-12 p-6 rounded-3xl bg-white border border-slate-200 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-slate-900 font-bold text-sm">Direct & Manual Payment Policy</p>
              <p className="text-slate-500">Payments are collected directly via bank transfer/cash. Once verified, Aftab issues your unique single-use code to activate your course on the app.</p>
            </div>
          </div>
          <a href="#how-it-works" className="text-purple-700 font-bold hover:underline shrink-0">
            See 3-Step Process →
          </a>
        </div>

      </div>
    </section>
  );
}
