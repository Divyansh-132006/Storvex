import {
  ShieldCheck,
  Cloud,
  Database,
  Share2,
  Zap,
  Layers,
} from "lucide-react";

import FeatureCard from "./FeatureCard";

function Features() {
    //Array of Object 
  const features = [
    {
      icon: ShieldCheck,
      title: "Secure File Storage",
      description:
        "Protect your files with encryption designed to keep your data private and secure.",
    },
    {
      icon: Cloud,
      title: "Multi-Cloud Storage",
      description:
        "Distribute your files across multiple cloud storage providers for improved reliability.",
    },
    {
      icon: Database,
      title: "Fault Tolerance",
      description:
        "Keep your files recoverable even when individual storage nodes become unavailable.",
    },
    {
      icon: Share2,
      title: "Easy File Sharing",
      description:
        "Share your files with others using secure links and simple access controls.",
    },
    {
      icon: Zap,
      title: "Fast File Retrieval",
      description:
        "Retrieve your stored files efficiently whenever you need them.",
    },
    {
      icon: Layers,
      title: "Smart File Distribution",
      description:
        "Split files into smaller chunks and distribute them across different storage locations.",
    },
  ];

  return (
    <>
    
    <section id="features" className="w-full bg-[#0A0A0A] text-white py-14">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-[#B7F542] font-semibold tracking-widest uppercase text-sm">
            Features
          </span>

          <h2 className="mt-4 text-3xl md:text-5xl font-bold">
            Everything Your Files Need
          </h2>

          <p className="mt-5 text-gray-400 text-base md:text-lg leading-relaxed">
            A smarter way to store, protect, distribute, and share
            your files across multiple cloud storage providers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
    </>
  );
}

export default Features;
