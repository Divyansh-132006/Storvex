
import { Link } from "react-router-dom";
import {
  Boxes,
//   Github,
//   Linkedin,
//   Twitter,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";

function Footer() {
  const footerLinks = {
    Product: [
      { name: "Features", href: "/#features" },
      { name: "How It Works", href: "/#how-it-works" },
      { name: "Dashboard", href: "/dashboard" },
      { name: "Upload Files", href: "/upload" },
    ],
    Company: [
      { name: "About Us", href: "/about" },
      { name: "Contact", href: "/contact" },
    ],
    Resources: [
      { name: "Documentation", href: "/docs" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
    ],
  };

  return (
    <footer className="border-t border-[#262626] bg-[#0A0A0A] text-[#F5F0E6]">
      <div className="mx-auto max-w-7xl px-[7%]">

        {/* Main Footer */}
        <div className="grid grid-cols-1 gap-10 py-12 md:grid-cols-2 lg:grid-cols-5 lg:gap-12">

          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B7F542] text-black">
                <Boxes size={22} />
              </div>

              <span className="text-2xl font-bold tracking-tight text-white">
                Storvex
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-6 text-[#A3A3A3]">
              A smarter way to store, secure, and distribute your files.
              Built with distributed storage architecture to keep your
              data reliable and accessible.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#111111] px-3 py-2">
              <ShieldCheck size={15} className="text-[#B7F542]" />

              <span className="text-xs text-[#D4D4D4]">
                Secure distributed storage
              </span>
            </div>

            {/* Social Links */}
            <div className="mt-6 flex items-center gap-3">
              
            </div>
          </div>

          {/* Link Sections */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-5 text-sm font-semibold text-white">
                {title}
              </h3>

              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-[#A3A3A3] transition hover:text-[#B7F542]"
                    >
                      {link.name}

                      <ArrowUpRight
                        size={13}
                        className="opacity-0 transition group-hover:opacity-100"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Footer */}
        <div className="flex flex-col gap-4 border-t border-[#262626] py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#737373]">
            © {new Date().getFullYear()} Storvex. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-5">
            <Link
              to="/privacy"
              className="text-xs text-[#737373] transition hover:text-[#B7F542]"
            >
              Privacy
            </Link>

            <Link
              to="/terms"
              className="text-xs text-[#737373] transition hover:text-[#B7F542]"
            >
              Terms
            </Link>

            <span className="text-xs text-[#737373]">
              Built for secure file distribution
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
