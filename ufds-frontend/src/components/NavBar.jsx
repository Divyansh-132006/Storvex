
import storvexLogo from "../assets/Storvex.png";
import { NavLink, Link } from "react-router-dom";

function Navbar() {
    const navClass = ({ isActive }) =>
        `transition-colors duration-300 pb-2 ${
            isActive
                ? "text-[#B7F542] font-medium border-b-2 border-[#B7F542]"
                : "text-gray-300 hover:text-[#B7F542]"
        }`;

    return (
        <nav className="sticky top-0 z-50 w-full bg-[#0A0A0A] border-b border-[#262626]">
            <div className="flex items-center justify-between px-[7%] py-5">
                <div className="flex items-center gap-3">
                    <img
                        src={storvexLogo}
                        alt="Storvex Logo"
                        className="w-10 h-10 object-contain"
                    />
                    <h1 className="text-white text-2xl font-bold">
                        Storvex
                    </h1>
                </div>
                <div className="flex items-center gap-9">
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

                {/* Authentication Buttons */}
                <div className="flex items-center gap-3">
                    <Link to="/login" className="px-5 py-2.5 bg-[#B7F542] text-black font-semibold rounded-lg hover:bg-[#A6E632] transition-all" >
                        Login
                    </Link>

                    <Link to="/signup" className="px-5 py-2.5 bg-[#B7F542] text-black font-semibold rounded-lg hover:bg-[#A6E632] transition-all" >
                        Sign Up
                    </Link>
                </div>

            </div>
        </nav>
    );
}

export default Navbar;
