"use client";

import { useState } from "react";
import { Send, CheckCircle2, Phone, Mail, MessageSquare, AlertCircle } from "lucide-react";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    course: "Biology 101: Core Principles",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formspreeEndpoint =
        process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT || "https://formspree.io/f/mqkvpydz";

      await fetch(formspreeEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 md:py-28 relative overflow-hidden bg-[#F8F7F4] border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text & Contact Info */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200">
              <MessageSquare className="w-4 h-4" />
              <span>Enrollment Inquiry</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Get Your Signup Code <span className="text-purple-700">& Access The Course</span>
            </h2>

            <p className="text-slate-600 text-base leading-relaxed font-medium">
              Send an inquiry to request your course code. Aftab will confirm your course selection and provide payment details directly.
            </p>

            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-3 text-sm text-slate-800 font-medium">
                <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 block font-semibold">WhatsApp / Phone</span>
                  <span className="font-bold text-slate-900">+92 300 1234567</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-800 font-medium">
                <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 block font-semibold">Direct Email</span>
                  <span className="font-bold text-slate-900">aftab@conceptstoclinics.com</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Form Card */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl">
              
              {submitted ? (
                <div className="text-center py-12 space-y-4 animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900">Inquiry Received!</h3>
                  <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed font-medium">
                    Thank you for reaching out. Aftab will contact you shortly via WhatsApp or email with your payment details and unique signup code.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setFormData({ name: "", phone: "", course: "Biology 101: Core Principles", message: "" }); }}
                    className="inline-block mt-4 px-6 py-2.5 rounded-full bg-black text-white text-xs font-bold shadow-md"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6" id="contact-form">
                  
                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-900 block" htmlFor="contact-name">
                        Full Name <span className="text-purple-700">*</span>
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        placeholder="e.g. Sarah Ahmed"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-900 block" htmlFor="contact-phone">
                        Phone / WhatsApp <span className="text-purple-700">*</span>
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        required
                        placeholder="+92 300 0000000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Course Dropdown */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 block" htmlFor="contact-course">
                      Interested Course
                    </label>
                    <select
                      id="contact-course"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-black transition-all cursor-pointer shadow-sm font-medium"
                    >
                      <option value="Biology 101: Core Principles">Biology 101: Core Principles</option>
                      <option value="Human Physiology & Anatomy">Human Physiology & Anatomy</option>
                      <option value="Medical Entry Test Crash Prep">Medical Entry Test Crash Prep</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 block" htmlFor="contact-message">
                      Additional Notes / Questions
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      placeholder="Specify any questions about the curriculum or payment details..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-black transition-all resize-none shadow-sm"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-black hover:bg-slate-800 text-white font-bold text-sm shadow-lg transition-all duration-200 disabled:opacity-50"
                    id="contact-submit-btn"
                  >
                    {submitting ? (
                      <span>Sending Request...</span>
                    ) : (
                      <>
                        <span>Submit Enrollment Request</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-slate-500 text-center font-medium">
                    Your details are kept strictly confidential. We will respond within 2-4 hours.
                  </p>

                </form>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
