import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import DemoVideo from "@/components/DemoVideo";
import CoursesOfferings from "@/components/CoursesOfferings";
import HowItWorks from "@/components/HowItWorks";
import AppShowcase from "@/components/AppShowcase";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <About />
        <DemoVideo />
        <CoursesOfferings />
        <HowItWorks />
        <AppShowcase />
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
}
