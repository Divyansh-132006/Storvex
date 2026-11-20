import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput";
import GoogleButton from "../components/GoogleButton";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signup, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next = {};
    if (form.name.trim().length < 2) next.name = "Name must be at least 2 characters";
    if (form.name.trim().length > 60) next.name = "Name must be at most 60 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email";
    if (form.password.length < 8) next.password = "Password must be at least 8 characters";
    else if (form.password.length > 72) next.password = "Password must be at most 72 characters";
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      next.password = "Password must include a letter and a number";
    }
    if (form.confirmPassword !== form.password) next.confirmPassword = "Passwords do not match";
    return next;
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      await signup(form.name.trim(), form.email.trim(), form.password);
      navigate("/dashboard");
    } catch (error) {
      setServerError(error.response?.data?.message || "Unable to create account");
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
        <h1>Create account</h1>
        <p className="subtitle">Start using UFDS</p>
        {serverError && <div className="server-error" role="alert">{serverError}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <FormInput label="Name" name="name" value={form.name} error={errors.name} onChange={(e) => update("name", e.target.value)} autoComplete="name" />
          <FormInput label="Email" name="email" type="email" value={form.email} error={errors.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" />
          <FormInput label="Password" name="password" type="password" value={form.password} error={errors.password} onChange={(e) => update("password", e.target.value)} autoComplete="new-password" />
          <FormInput label="Confirm password" name="confirmPassword" type="password" value={form.confirmPassword} error={errors.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} autoComplete="new-password" />
          <button className="button primary" type="submit" disabled={submitting}>
            {submitting ? <span className="spinner" /> : "Create account"}
          </button>
        </form>
        <div className="divider"><span>or</span></div>
        <div className="google-wrap">
          <GoogleButton onSuccess={handleGoogle} onError={() => setServerError("Google Sign-In failed")} />
        </div>
        <p className="auth-link">Already have an account? <Link to="/login">Login</Link></p>
      </section>
    </main>
  );
}
