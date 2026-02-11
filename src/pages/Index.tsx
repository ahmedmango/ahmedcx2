import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import OceanFlowEffect from "@/components/OceanFlowEffect";
import CollectionsSection from "@/components/CollectionsSection";
import AboutSection from "@/components/AboutSection";
import WaitlistSection from "@/components/WaitlistSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import MobileLayout from "@/components/MobileLayout";

const Index = () => {
  return (
    <MobileLayout>
      <div className="min-h-screen overflow-x-hidden scroll-smooth">
        {/* Desktop Navigation */}
        <div className="hidden md:block">
          <Navigation />
        </div>
        
        <div className="animate-fade-in">
          <HeroSection />
        </div>
        <div className="animate-fade-in [animation-delay:100ms]">
          <OceanFlowEffect />
        </div>
        <div className="animate-fade-in [animation-delay:200ms]">
          <CollectionsSection />
        </div>
        <div className="animate-fade-in [animation-delay:400ms]">
          <AboutSection />
        </div>
        <div className="animate-fade-in [animation-delay:600ms]">
          <WaitlistSection />
        </div>
        <div className="animate-fade-in [animation-delay:800ms]">
          <ContactSection />
        </div>
        <div className="animate-fade-in [animation-delay:1000ms]">
          <Footer />
        </div>
      </div>
    </MobileLayout>
  );
};

export default Index;
