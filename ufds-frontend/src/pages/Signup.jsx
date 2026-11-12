
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
  ArrowRight,
  Check,
  ShieldCheck,
  Cloud,
  Boxes,
} from "lucide-react";

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    console.log("Signup form data:", formData);
  };

  const passwordChecks = [
    {
      label: "At least 8 characters",
      valid: formData.password.length >= 8,
    },
    {
      label: "Contains an uppercase letter",
      valid: /[A-Z]/.test(formData.password),
    },
    {
      label: "Contains a number",
      valid: /[0-9]/.test(formData.password),
    },
  ];

  return (
    <main className="h-screen w-full overflow-hidden bg-[#0A0A0A] text-[#F5F0E6]">
      <div className="grid h-full grid-cols-1 lg:grid-cols-2">

        {/* Left Section */}
        <section className="relative hidden h-full flex-col justify-between overflow-hidden border-r border-[#262626] bg-[#0A0A0A] p-8 xl:p-10 lg:flex">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B7F542] text-black">
              <Boxes size={22} />
            </div>

            <span className="text-2xl font-bold tracking-tight text-white">
              Storvex
            </span>
          </Link>

          <div className="relative flex flex-col items-center justify-center">
            <div className="absolute h-64 w-64 rounded-full border border-[#262626]" />
            <div className="absolute h-48 w-48 rounded-full border border-[#333333]" />
            <div className="absolute h-32 w-32 rounded-full border border-[#404040]" />

            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-[#B7F542]/30 bg-[#B7F542]/10">
              <Cloud size={42} className="text-[#B7F542]" />
            </div>

            <div className="mt-8 max-w-md text-center">
              <h1 className="text-3xl font-bold leading-tight text-white xl:text-4xl">
                Your files.
                <br />
                <span className="text-[#B7F542]">Your control.</span>
              </h1>

              <p className="mt-4 text-sm leading-6 text-[#A3A3A3]">
                Securely distribute your files across multiple storage nodes
                with intelligent encryption and reliable reconstruction.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-full border border-[#262626] bg-[#111111] px-4 py-2">
              <ShieldCheck size={16} className="text-[#B7F542]" />
              <span className="text-xs text-[#D4D4D4]">
                Distributed storage. Built for security.
              </span>
            </div>
          </div>

          <p className="text-xs text-[#737373]">
            © 2026 Storvex. All rights reserved.
          </p>
        </section>

        {/* Right Section */}
        <section className="flex h-full items-center justify-center overflow-hidden px-5 md:px-8">
          <div className="w-full max-w-md">

            {/* Mobile Logo */}
            <Link to="/" className="mb-5 flex items-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#B7F542] text-black">
                <Boxes size={20} />
              </div>

              <span className="text-xl font-bold text-white">Storvex</span>
            </Link>

            <div className="mb-5">
              <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                Create your account
              </h2>

              <p className="mt-2 text-sm text-[#A3A3A3]">
                Get started with secure distributed file storage.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">

              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-1.5 block text-sm font-medium text-[#D4D4D4]"
                >
                  Full name
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-[#262626] bg-[#111111] px-4 py-3 transition focus-within:border-[#B7F542]">
                  <UserRound size={18} className="text-[#737373]" />

                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#525252]"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-[#D4D4D4]"
                >
                  Email address
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-[#262626] bg-[#111111] px-4 py-3 transition focus-within:border-[#B7F542]">
                  <Mail size={18} className="text-[#737373]" />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#525252]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-[#D4D4D4]"
                >
                  Password
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-[#262626] bg-[#111111] px-4 py-3 transition focus-within:border-[#B7F542]">
                  <LockKeyhole size={18} className="text-[#737373]" />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#525252]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#737373] transition hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-medium text-[#D4D4D4]"
                >
                  Confirm password
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-[#262626] bg-[#111111] px-4 py-3 transition focus-within:border-[#B7F542]">
                  <LockKeyhole size={18} className="text-[#737373]" />

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#525252]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="text-[#737373] transition hover:text-white"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="grid grid-cols-1 gap-1 pt-1 sm:grid-cols-2">
                {passwordChecks.map((check, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-xs"
                  >
                    <Check
                      size={14}
                      className={
                        check.valid
                          ? "text-[#B7F542]"
                          : "text-[#525252]"
                      }
                    />

                    <span
                      className={
                        check.valid
                          ? "text-[#B7F542]"
                          : "text-[#737373]"
                      }
                    >
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#B7F542] py-3 text-sm font-semibold text-black transition hover:bg-[#A5E632]"
              >
                Create account
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </form>

            {/* Login */}
            <p className="mt-4 text-center text-sm text-[#A3A3A3]">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#B7F542] transition hover:text-white"
              >
                Log in
              </Link>
            </p>

            <p className="mt-3 text-center text-xs leading-5 text-[#525252]">
              By creating an account, you agree to our{" "}
              <span className="cursor-pointer text-[#A3A3A3] hover:text-white">
                Terms of Service
              </span>{" "}
              and{" "}
              <span className="cursor-pointer text-[#A3A3A3] hover:text-white">
                Privacy Policy
              </span>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Signup;
