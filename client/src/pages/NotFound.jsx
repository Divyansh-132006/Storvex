import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="not-found">
      <h1>404</h1>
      <p>Page not found</p>
      <Link className="button primary" to="/dashboard">Go to dashboard</Link>
    </main>
  );
}
