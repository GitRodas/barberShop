import type { InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  errors?: string[];
  hint?: string;
};

export function Field({ label, name, errors, hint, id, ...props }: FieldProps) {
  const inputId = id ?? name;
  const describedBy = [
    hint ? `${inputId}-hint` : null,
    errors?.length ? `${inputId}-error` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy || undefined}
        className="block w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-base outline-none transition-colors placeholder:text-muted/70 focus:border-accent aria-invalid:border-danger sm:text-sm"
        {...props}
      />
      {hint && (
        <p id={`${inputId}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {errors?.length ? (
        <p id={`${inputId}-error`} className="text-xs text-danger">
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}
