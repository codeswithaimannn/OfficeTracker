import { useId, type SelectHTMLAttributes } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  hideLabel?: boolean; // e.g. in a filter bar; still read by screen readers
}

// A labelled dropdown, styled like TextField.
export function SelectField({
  label,
  options,
  hideLabel = false,
  className = '',
  ...selectProps
}: SelectFieldProps) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'text-sm font-medium'}>
        {label}
      </label>
      <select
        id={id}
        className="min-h-11 rounded-lg border border-line bg-field px-3 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-60"
        {...selectProps}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
