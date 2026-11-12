
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ArrowRight,
  ShieldCheck,
  Cloud,
  Boxes,
} from "lucide-react";

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    console.log("Login Data:", {
      ...formData,
      rememberMe,
    });

    // Backend authentication will be connected here
  };

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
                Welcome
                <br />
                <span className="text-[#B7F542]">back to Storvex.</span>
              </h1>

              <p className="mt-4 text-sm leading-6 text-[#A3A3A3]">
                Access your distributed storage dashboard and manage
                your files securely from anywhere.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-full border border-[#262626] bg-[#111111] px-4 py-2">
              <ShieldCheck size={16} className="text-[#B7F542]" />
              <span className="text-xs text-[#D4D4D4]">
                Your data. Your control.
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
            <Link to="/" className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#B7F542] text-black">
                <Boxes size={20} />
              </div>

              <span className="text-xl font-bold text-white">
                Storvex
              </span>
            </Link>

            <div className="mb-7">
              <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-[#A3A3A3]">
                Enter your credentials to access your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-[#D4D4D4]"
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
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[#D4D4D4]"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-[#B7F542] transition hover:text-white"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-[#262626] bg-[#111111] px-4 py-3 transition focus-within:border-[#B7F542]">
                  <LockKeyhole size={18} className="text-[#737373]" />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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

              {/* Remember Me */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 cursor-pointer accent-[#B7F542]"
                />

                <label
                  htmlFor="rememberMe"
                  className="cursor-pointer text-sm text-[#A3A3A3]"
                >
                  Remember me
                </label>
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}

              {/* Login Button */}
              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#B7F542] py-3 text-sm font-semibold text-black transition hover:bg-[#A5E632]"
              >
                Log in
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </form>

            {/* Signup Link */}
            <p className="mt-6 text-center text-sm text-[#A3A3A3]">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold text-[#B7F542] transition hover:text-white"
              >
                Create account
              </Link>
            </p>

            {/* Footer */}
            <p className="mt-5 text-center text-xs leading-5 text-[#525252]">
              By logging in, you agree to our{" "}
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

export default Login;
