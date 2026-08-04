"use client";

export default function Footer() {
  return (
    <footer className="bg-[#F8F7F4] border-t border-slate-200 py-12 text-xs text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-white font-bold text-sm shadow-sm">
              🎓
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-sm">ConceptsToClinics</span>
              <span className="text-slate-500 block text-[11px] font-medium">Private Online Medical & Biology Platform</span>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-700 font-bold">
            <a href="#about" className="hover:text-black transition-colors">About Tutor</a>
            <a href="#demo" className="hover:text-black transition-colors">Demo Video</a>
            <a href="#courses" className="hover:text-black transition-colors">Courses</a>
            <a href="#how-it-works" className="hover:text-black transition-colors">How It Works</a>
            <a href="#app-features" className="hover:text-black transition-colors">App Features</a>
            <a href="#contact" className="hover:text-black transition-colors">Contact</a>
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right text-slate-500 text-[11px] font-medium">
            <p>© {new Date().getFullYear()} ConceptsToClinics. All rights reserved.</p>
            <p className="mt-0.5">Designed & Developed for Educator Aftab.</p>
          </div>

        </div>
      </div>
    </footer>
  );
}
