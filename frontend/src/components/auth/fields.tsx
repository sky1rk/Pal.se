export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[11px] font-semibold tracking-[0.5px] text-theme-gray"
    >
      {children}
    </label>
  );
}

const INPUT_CLS =
  "w-full rounded-md border border-black/[0.08] bg-theme-field px-4 py-3 text-[15px] text-theme-field-text outline-none placeholder:text-theme-placeholder focus:border-theme-crimson";

export function TextField({
  id,
  type = "text",
  name,
  autoComplete,
  required = true,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  type?: string;
  name?: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      id={id}
      type={type}
      name={name}
      autoComplete={autoComplete}
      required={required}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={INPUT_CLS}
    />
  );
}
