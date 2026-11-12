
function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="group p-6 rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#B7F542] hover:-translate-y-1 transition-all duration-300">
      <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-[#B7F542]/10 text-[#B7F542] group-hover:bg-[#B7F542] group-hover:text-black transition-all duration-300">
        <Icon size={28} strokeWidth={1.8} />
      </div>

      <h3 className="mt-6 text-xl font-semibold text-white">
        {title}
      </h3>

      <p className="mt-3 text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export default FeatureCard;
