// src/pages/public/Home.jsx
import Hero from "../../components/home/Hero";
import ResearchStats from "../../components/home/ResearchStats";
import FeaturedProjects from "../../components/home/FeaturedProjects";
import Testimonials from "../../components/home/Testimonials";
import ContactSection from "../../components/home/ContactSection";

export default function Home() {
  return (
    <>
      <Hero />
      <ResearchStats />
      <FeaturedProjects />
      <Testimonials />
      <ContactSection />
    </>
  );
}
