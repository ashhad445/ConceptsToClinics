"use client";

import { CreditCard, Key, Smartphone, ArrowRight, CheckCircle2 } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: CreditCard,
      title: "Contact & Select Course",
      description:
        "Reach out directly to tutor Aftab via the inquiry form or WhatsApp. Choose the course bundle you want to enroll in and arrange payment via bank transfer or cash.",
    },
    {
      number: "02",
      icon: Key,
      title: "Receive Unique Signup Code",
      description:
        "Once payment is verified, Aftab generates your individual, single-use enrollment code (e.g. TXM4-VYY5) mapped specifically to your selected course.",
    },
    {
      number: "03",
      icon: Smartphone,
      title: "Register & Watch on Android App",
      description:
        "Install the mobile application, enter your signup code during registration, and immediately access your high-definition lectures with progress tracking.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 relative overflow-hidden bg-[#F8F7F4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200">
            <span>Simple 3-Step Process</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How Student Access Works
          </h2>
          <p className="text-slate-600 text-base">
            Zero complicated subscriptions or automated credit card billing. Clear, straightforward access in 3 quick steps.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative rounded-3xl p-8 bg-white border border-slate-200 shadow-xl flex flex-col justify-between hover:shadow-2xl transition-all duration-300 group"
              >
                <div>
                  {/* Step Header Number & Icon */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-white shadow-md">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-4xl font-black text-slate-200 group-hover:text-slate-300 transition-colors">
                      {step.number}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-extrabold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-600 text-xs leading-relaxed font-medium">{step.description}</p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-2 text-xs text-purple-700 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Step {step.number} Verified</span>
                </div>
              </div>
            );
          })}

        </div>

        {/* Action CTA */}
        <div className="mt-16 text-center">
          <a
            href="#contact"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-black hover:bg-slate-800 text-white font-bold text-base shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            id="how-it-works-start-btn"
          >
            <span>Start Your Enrollment Now</span>
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>

      </div>
    </section>
  );
}
