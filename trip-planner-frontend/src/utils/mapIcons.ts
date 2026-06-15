import L from 'leaflet';

function pinIcon(color: string, innerSvg: string) {
  return L.divIcon({
    className: '',
    html: `
      <div aria-hidden="true" style="width:34px;height:42px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.25))">
        <svg viewBox="0 0 34 42" width="34" height="42" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M17 1C10.373 1 5 6.373 5 13c0 8.5 12 27 12 27s12-18.5 12-27C29 6.373 23.627 1 17 1z"
            fill="${color}"
            stroke="#fff"
            stroke-width="1.5"
          />
          <g transform="translate(9, 7)">${innerSvg}</g>
        </svg>
      </div>
    `,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -36],
  });
}

const ICONS = {
  current: `
    <circle cx="8" cy="8" r="2.5" fill="#fff"/>
    <circle cx="8" cy="8" r="5.5" fill="none" stroke="#fff" stroke-width="1.5"/>
  `,
  pickup: `
    <rect x="2" y="4" width="12" height="9" rx="1.5" fill="none" stroke="#fff" stroke-width="1.5"/>
    <path d="M2 6.5 L8 10 L14 6.5" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>
  `,
  dropoff: `
    <path d="M3 14 V3" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M3 3 H13 L11 7.5 L13 12 H3 Z" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>
  `,
  fuel: `
    <rect x="3" y="2" width="9" height="13" rx="1.5" fill="none" stroke="#fff" stroke-width="1.5"/>
    <path d="M12 5 H14 V9" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
    <rect x="5.5" y="5" width="4" height="3" rx="0.5" fill="#fff"/>
  `,
};

export const currentLocationIcon = pinIcon('#16a34a', ICONS.current);
export const pickupLocationIcon = pinIcon('#2563eb', ICONS.pickup);
export const dropoffLocationIcon = pinIcon('#dc2626', ICONS.dropoff);
export const fuelStopIcon = pinIcon('#d97706', ICONS.fuel);

export const MAP_LEGEND = [
  { key: 'current', label: 'Current location', color: '#16a34a' },
  { key: 'pickup', label: 'Pickup', color: '#2563eb' },
  { key: 'dropoff', label: 'Dropoff', color: '#dc2626' },
  { key: 'fuel', label: 'Fuel stop', color: '#d97706' },
] as const;
