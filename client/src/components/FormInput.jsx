import { useState } from "react";

export default function FormInput({
  label,
  type = "text",
  error,
  ...props
}) {
  const [visible, setVisible] = useState(false);
  const password = type === "password";
  const inputType = password && visible ? "text" : type;

  return (
    <label className="form-field">
      <span>{label}</span>
      <div className="input-wrap">
        <input
          type={inputType}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {password && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}
