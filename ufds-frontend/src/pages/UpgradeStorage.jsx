import { useState } from "react";
import {
  HardDrive,
  Check,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Cloud,
  CreditCard,
  ChevronLeft,
  CircleHelp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const storagePlans = [
  {
    id: "starter",
    name: "Starter",
    description: "For personal cloud storage.",
    capacity: "Configure capacity",
    price: "Configure price",
    features: [
      "Secure cloud file storage",
      "Multi-cloud distribution",
      "File sharing",
      "Standard file retrieval",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    description: "For users with growing storage needs.",
    capacity: "Configure capacity",
    price: "Configure price",
    popular: true,
    features: [
      "Everything in Starter",
      "Higher storage capacity",
      "Advanced file sharing",
      "Priority file retrieval",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For users needing more storage.",
    capacity: "Configure capacity",
    price: "Configure price",
    features: [
      "Everything in Plus",
      "Maximum storage capacity",
      "Enhanced distribution",
      "Priority support",
    ],
  },
];

function UpgradeStorage() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState("plus");
  const [billingCycle, setBillingCycle] = useState("monthly");

  const handleUpgrade = (plan) => {
    // Connect this handler to your subscription / checkout API.
    console.log("Selected plan:", plan);
    console.log("Billing cycle:", billingCycle);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">

        {/* Breadcrumb */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm text-[#777777] transition hover:text-[#B7F542]"
        >
          <ChevronLeft size={16} />
          Back
        </button>

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#B7F542]/20 bg-[#B7F542]/10">
            <HardDrive size={26} className="text-[#B7F542]" />
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Upgrade your storage
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#777777]">
            Get more space for your files with Storvex's distributed cloud
            storage. Choose the plan that fits your needs.
          </p>
        </div>

        {/* Current Plan Overview */}
        <div className="mb-10 rounded-2xl border border-[#262626] bg-[#111111] p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A1A1A]">
                <Cloud size={23} className="text-[#B7F542]" />
              </div>

              <div>
                <p className="text-xs text-[#777777]">
                  Your current storage plan
                </p>

                <h2 className="mt-1 text-lg font-semibold">
                  Current plan
                </h2>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-sm text-[#777777]">
                Storage usage
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                Usage unavailable
              </p>
            </div>
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#262626]">
            <div className="h-full w-0 rounded-full bg-[#B7F542]" />
          </div>

          <div className="mt-3 flex justify-between text-xs text-[#666666]">
            <span>Used storage unavailable</span>
            <span>Total storage unavailable</span>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="inline-flex rounded-xl border border-[#262626] bg-[#111111] p-1">
            {["monthly", "yearly"].map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`rounded-lg px-5 py-2.5 text-sm font-medium capitalize transition ${
                  billingCycle === cycle
                    ? "bg-[#B7F542] text-black"
                    : "text-[#777777] hover:text-white"
                }`}
              >
                {cycle}
              </button>
            ))}
          </div>

          <p className="text-xs text-[#666666]">
            Billing prices will appear when plans are configured.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {storagePlans.map((plan) => {
            const isSelected = selectedPlan === plan.id;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative flex cursor-pointer flex-col rounded-2xl border p-6 transition-all ${
                  isSelected
                    ? "border-[#B7F542] bg-[#B7F542]/[0.03]"
                    : "border-[#262626] bg-[#111111] hover:border-[#444444]"
                }`}
              >
                {/* Popular */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#B7F542] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black">
                    Popular
                  </div>
                )}

                {/* Plan Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {plan.name}
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-[#777777]">
                      {plan.description}
                    </p>
                  </div>

                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      isSelected
                        ? "bg-[#B7F542]/10 text-[#B7F542]"
                        : "bg-[#1A1A1A] text-[#777777]"
                    }`}
                  >
                    {plan.id === "starter" && <Cloud size={19} />}
                    {plan.id === "plus" && <Zap size={19} />}
                    {plan.id === "pro" && <ShieldCheck size={19} />}
                  </div>
                </div>

                {/* Capacity */}
                <div className="my-7 border-y border-[#262626] py-5">
                  <p className="text-xs text-[#777777]">
                    Storage capacity
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    {plan.capacity}
                  </h2>

                  <p className="mt-3 text-sm text-[#B7F542]">
                    {plan.price}
                    <span className="ml-1 text-xs text-[#666666]">
                      / {billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </p>
                </div>

                {/* Features */}
                <div className="flex-1 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#666666]">
                    What's included
                  </p>

                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-3"
                    >
                      <Check
                        size={16}
                        className="mt-0.5 shrink-0 text-[#B7F542]"
                      />

                      <span className="text-sm text-[#BDBDBD]">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(plan.id);
                    handleUpgrade(plan);
                  }}
                  className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isSelected
                      ? "bg-[#B7F542] text-black hover:bg-[#A5E632]"
                      : "border border-[#333333] bg-[#1A1A1A] text-white hover:border-[#B7F542] hover:text-[#B7F542]"
                  }`}
                >
                  {isSelected ? "Selected Plan" : "Choose Plan"}
                  <ArrowUpRight size={16} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Secure Payment */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#262626] bg-[#111111] p-6 text-center sm:flex-row">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A1A1A]">
            <CreditCard size={20} className="text-[#B7F542]" />
          </div>

          <div>
            <h3 className="text-sm font-medium text-white">
              Secure payment
            </h3>

            <p className="mt-1 text-xs text-[#777777]">
              Payment processing will be available once checkout is integrated.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <CircleHelp size={20} className="text-[#777777]" />

          <h3 className="text-sm font-medium text-white">
            Need help choosing a plan?
          </h3>

          <p className="max-w-md text-xs leading-5 text-[#777777]">
            Storage capacities, plan pricing, billing, and payment options
            can be configured according to your actual subscription model.
          </p>
        </div>
      </div>
    </div>
  );
}

export default UpgradeStorage;
