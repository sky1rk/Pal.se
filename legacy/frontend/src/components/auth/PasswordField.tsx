import { useState } from "react";
import { FieldLabel } from "./fields";
import { EyeIcon, EyeOffIcon } from "./icons";

export default function PasswordField({
  id,
  label,
  name,
  autoComplete,
  placeholder,
  value,
  onChange,
  required = true,
}: {
  id: string;
  label: string;
  name?: string;
  autoComplete?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-black/[0.08] bg-theme-field py-3 pl-4 pr-12 text-[15px] text-theme-field-text outline-none transition placeholder:text-theme-placeholder focus:border-theme-crimson focus:ring-2 focus:ring-theme-crimson/15"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded text-theme-gray transition-colors hover:text-theme-field-text"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}
