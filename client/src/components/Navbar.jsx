import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="navbar">
      <Link className="brand" to={user ? "/dashboard" : "/"}>UFDS</Link>
      {user ? (
        <button className="button secondary" type="button" onClick={logout}>
          Logout
        </button>
      ) : (
        <div className="nav-links">
          <Link to="/login">Login</Link>
          <Link to="/signup">Sign up</Link>
        </div>
      )}
    </nav>
  );
}
