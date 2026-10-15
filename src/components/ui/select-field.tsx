import type { SelectHTMLAttributes } from "react";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  name: string;
  options: readonly { value: string | number; label: string }[];
  errors?: string[];
  hint?: string;
};

export function SelectField({
  label,
  name,
  options,
  errors,
  hint,
  id,
  ...props
}: SelectFieldProps) {
  const inputId = id ?? name;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
      </label>
      <select
        id={inputId}
        name={name}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={hint ? `${inputId}-hint` : undefined}
        className="block w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-base outline-none focus:border-accent aria-invalid:border-danger sm:text-sm"
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && (
        <p id={`${inputId}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {errors?.length ? <p className="text-xs text-danger">{errors[0]}</p> : null}
    </div>
  );
}
