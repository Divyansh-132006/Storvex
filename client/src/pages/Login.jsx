import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput";
import GoogleButton from "../components/GoogleButton";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email";
    if (!form.password) next.password = "Password is required";
    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      navigate("/dashboard");
    } catch (error) {
      setServerError(error.response?.data?.message || "Unable to log in");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle(idToken) {
    setServerError("");
    setSubmitting(true);
    try {
      await googleLogin(idToken);
      navigate("/dashboard");
    } catch (error) {
      setServerError(error.response?.data?.message || "Google Sign-In failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <h1>Welcome back</h1>
        <p className="subtitle">Sign in to UFDS</p>
        {serverError && <div className="server-error" role="alert">{serverError}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={form.email}
            error={errors.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            autoComplete="email"
          />
          <FormInput
            label="Password"
            name="password"
            type="password"
            value={form.password}
            error={errors.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            autoComplete="current-password"
          />
          <button className="button primary" type="submit" disabled={submitting}>
            {submitting ? <span className="spinner" /> : "Login"}
          </button>
        </form>
        <div className="divider"><span>or</span></div>
        <div className="google-wrap">
          <GoogleButton onSuccess={handleGoogle} onError={() => setServerError("Google Sign-In failed")} />
        </div>
        <p className="auth-link">New to UFDS? <Link to="/signup">Create an account</Link></p>
      </section>
    </main>
  );
}
