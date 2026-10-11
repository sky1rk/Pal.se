import { inputClass, labelClass } from "./ui/inputStyles";
import type { FieldSection } from "./patientForm";

interface SectionGridProps {
  section: FieldSection;
  values: Record<string, string>;
  setField: (name: string, value: string) => void;
}

export default function SectionGrid({ section, values, setField }: SectionGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {section.fields.map((field) =>
        field.kind === "checkbox" ? (
          <label
            key={field.name}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-theme-line bg-white px-3.5 py-2.5 text-sm shadow-sm transition hover:border-theme-crimson/40"
          >
            <input
              type="checkbox"
              checked={values[field.name] === "1"}
              onChange={(e) => setField(field.name, e.target.checked ? "1" : "0")}
              className="h-4 w-4 cursor-pointer rounded accent-theme-crimson"
            />
            <span className="font-medium text-theme-ink-soft">{field.label}</span>
          </label>
        ) : (
          <label key={field.name} className="block">
            <span className={labelClass}>{field.label}</span>
            {field.kind === "select" ? (
              <select
                value={values[field.name]}
                onChange={(e) => setField(field.name, e.target.value)}
                className={inputClass}
              >
                {(field.options ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.kind}
                value={values[field.name]}
                placeholder={field.placeholder}
                onChange={(e) => setField(field.name, e.target.value)}
                className={inputClass}
              />
            )}
          </label>
        ),
      )}
    </div>
  );
}
