/** Animated truck driving on a scrolling road — used while planning a trip. */
export function TruckLoader() {
  return (
    <div className="truck-loader mx-auto mb-6" role="img" aria-label="Planning trip">
      <div className="truck-loader__scene">
        <div className="truck-loader__cloud truck-loader__cloud--1" />
        <div className="truck-loader__cloud truck-loader__cloud--2" />

        <svg
          className="truck-loader__truck"
          viewBox="0 0 80 44"
          width="80"
          height="44"
          aria-hidden
        >
          <rect x="4" y="14" width="34" height="18" rx="2" fill="#2563eb" />
          <path d="M38 18h14l8 8v6H38z" fill="#1d4ed8" />
          <rect x="42" y="20" width="10" height="7" rx="1" fill="#93c5fd" />
          <g className="truck-loader__wheel">
            <circle cx="16" cy="34" r="6" fill="#1e293b" />
            <circle cx="16" cy="34" r="2.5" fill="#94a3b8" />
          </g>
          <g className="truck-loader__wheel">
            <circle cx="52" cy="34" r="6" fill="#1e293b" />
            <circle cx="52" cy="34" r="2.5" fill="#94a3b8" />
          </g>
          <rect x="2" y="28" width="6" height="3" rx="1" fill="#cbd5e1" opacity="0.8" />
        </svg>

        <div className="truck-loader__road">
          <div className="truck-loader__dash" />
        </div>
      </div>
    </div>
  );
}
