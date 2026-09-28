import { useState } from "react";
import { FieldLabel } from "./fields";
import { EyeIcon } from "./icons";

export default function PasswordField({
  id,
  label,
  name,
  autoComplete,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  name?: string;
  autoComplete?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
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
          required
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-black/[0.08] bg-theme-field py-3 pl-4 pr-12 text-[15px] text-theme-field-text outline-none placeholder:text-theme-placeholder focus:border-theme-crimson"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-gray hover:text-theme-field-text"
        >
          <EyeIcon />
        </button>
      </div>
    </div>
  );
}
