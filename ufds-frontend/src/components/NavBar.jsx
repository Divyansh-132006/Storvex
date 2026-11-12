
import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import storvexLogo from "../assets/Storvex.png";

function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    const navClass = ({ isActive }) =>
        `transition-colors duration-300 pb-2 ${
            isActive
                ? "text-[#B7F542] font-medium border-b-2 border-[#B7F542]"
                : "text-gray-300 hover:text-[#B7F542]"
        }`;

    const mobileNavClass = ({ isActive }) =>
        `block py-3 transition-colors duration-300 ${
            isActive
                ? "text-[#B7F542] font-medium"
                : "text-gray-300 hover:text-[#B7F542]"
        }`;

    const closeMenu = () => setIsOpen(false);

    return (
        <nav className="sticky top-0 z-50 w-full bg-[#0A0A0A] border-b border-[#262626]">
            <div className="flex items-center justify-between px-[7%] py-5">

                {/* Logo */}
                <Link
                    to="/"
                    onClick={closeMenu}
                    className="flex items-center gap-3"
                >
                    <img
                        src={storvexLogo}
                        alt="Storvex Logo"
                        className="w-10 h-10 object-contain"
                    />
                    <h1 className="text-white text-2xl font-bold">
                        Storvex
                    </h1>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-9">
                    <NavLink to="/" end className={navClass}>
                        Home
                    </NavLink>
                    <NavLink to="/features" className={navClass}>
                        Features
                    </NavLink>
                    <NavLink to="/howitworks" className={navClass}>
                        How it Works
                    </NavLink>
                </div>

                {/* Desktop Authentication */}
                <div className="hidden md:flex items-center gap-3">
                    <Link
                        to="/login"
                        className="px-5 py-2.5 bg-[#B7F542] text-black font-semibold rounded-lg hover:bg-[#A6E632] transition-all"
                    >
                        Login
                    </Link>

                    <Link
                        to="/signup"
                        className="px-5 py-2.5 bg-[#B7F542] text-black font-semibold rounded-lg hover:bg-[#A6E632] transition-all"
                    >
                        Sign Up
                    </Link>
                </div>

                {/* Mobile Hamburger Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden text-white p-2 rounded-lg hover:bg-[#1A1A1A] transition-all"
                    aria-label={isOpen ? "Close menu" : "Open menu"}
                    aria-expanded={isOpen}
                    aria-controls="mobile-menu"
                >
                    {isOpen ? (
                        <X size={27} strokeWidth={2} />
                    ) : (
                        <Menu size={27} strokeWidth={2} />
                    )}
                </button>
            </div>

            {/* Mobile Navigation Menu */}
            <div
                id="mobile-menu"
                className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen
                        ? "max-h-96 opacity-100 border-t border-[#262626]"
                        : "max-h-0 opacity-0"
                }`}
            >
                <div className="px-[7%] py-5 flex flex-col">

                    <NavLink
                        to="/"
                        end
                        className={mobileNavClass}
                        onClick={closeMenu}
                    >
                        Home
                    </NavLink>

                    <NavLink
                        to="/features"
                        className={mobileNavClass}
                        onClick={closeMenu}
                    >
                        Features
                    </NavLink>

                    <NavLink
                        to="/howitworks"
                        className={mobileNavClass}
                        onClick={closeMenu}
                    >
                        How it Works
                    </NavLink>

                    {/* Mobile Authentication Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-5 pt-5 border-t border-[#262626]">
                        <Link
                            to="/login"
                            onClick={closeMenu}
                            className="w-full text-center px-5 py-3 bg-[#B7F542] text-black font-semibold rounded-lg hover:bg-[#A6E632] transition-all"
                        >
                            Login
                        </Link>

                        <Link
                            to="/signup"
                            onClick={closeMenu}
                            className="w-full text-center px-5 py-3 bg-[#B7F542] text-black font-semibold rounded-lg hover:bg-[#A6E632] transition-all"
                        >
                            Sign Up
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
