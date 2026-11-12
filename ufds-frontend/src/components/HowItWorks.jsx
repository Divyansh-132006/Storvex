import {
  UploadCloud,
  LockKeyhole,
  Scissors,
  Cloud,
  FileCheck,
} from "lucide-react";
function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: UploadCloud,
      title: "Upload",
      description:
        "Upload your file to Storvex through a simple and intuitive interface.",
    },
    {
      number: "02",
      icon: LockKeyhole,
      title: "Encrypt",
      description:
        "Encrypt your file to help protect its contents before distribution.",
    },
    {
      number: "03",
      icon: Scissors,
      title: "Split",
      description:
        "Divide the encrypted file into smaller chunks for distributed storage.",
    },
    {
      number: "04",
      icon: Cloud,
      title: "Distribute",
      description:
        "Store file chunks across multiple cloud storage providers.",
    },
    {
      number: "05",
      icon: FileCheck,
      title: "Reconstruct",
      description:
        "Retrieve the required chunks and reconstruct your original file.",
    },
  ];

  return (
    <>
    <section
      id="how-it-works"
      className="w-full bg-[#0A0A0A] text-white py-14 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-[#B7F542] font-semibold tracking-widest uppercase text-sm">
            How It Works
          </span>

          <h2 className="mt-4 text-3xl md:text-5xl font-bold">
            Your Files, Protected at Every Step
          </h2>

          <p className="mt-5 text-gray-400 text-base md:text-lg leading-relaxed">
            From uploading to retrieval, Storvex uses a distributed
            workflow to help protect and manage your files.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mt-16">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="group relative p-6 rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#B7F542] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[#B7F542] text-sm font-bold tracking-widest">
                    {step.number}
                  </span>

                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#B7F542]/10 text-[#B7F542] group-hover:bg-[#B7F542] group-hover:text-black transition-all duration-300">
                    <Icon size={24} strokeWidth={1.8} />
                  </div>
                </div>

                <h3 className="mt-6 text-xl font-semibold">
                  {step.title}
                </h3>

                <p className="mt-3 text-gray-400 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
    </>
  );
}

export default HowItWorks;
