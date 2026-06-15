interface LocationFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  disabled?: boolean;
  onOpenMap: () => void;
  onGps?: () => void;
  gpsLoading?: boolean;
}

export function LocationField({
  id,
  label,
  value,
  placeholder,
  disabled,
  onOpenMap,
  onGps,
  gpsLoading,
}: LocationFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </label>
      <button
        id={id}
        type="button"
        onClick={onOpenMap}
        disabled={disabled}
        className="input-field flex w-full items-center justify-between gap-2 text-left disabled:cursor-not-allowed"
      >
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <span className="shrink-0 text-xs font-semibold text-blue-600">Pin on map</span>
      </button>
      {onGps && (
        <button
          type="button"
          onClick={onGps}
          disabled={disabled || gpsLoading}
          className="mt-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          {gpsLoading ? 'Getting GPS…' : 'Or use my current GPS location'}
        </button>
      )}
    </div>
  );
}
