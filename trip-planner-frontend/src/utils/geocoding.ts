const NOMINATIM_HEADERS = {
  Accept: 'application/json',
  'Accept-Language': 'en',
};

export interface PlaceSuggestion {
  id: string;
  label: string;
  detail: string;
  fullName: string;
  lat: number;
  lng: number;
  zoom: number;
}

interface NominatimAddress {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  country?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  class?: string;
  type?: string;
  addresstype?: string;
  address?: NominatimAddress;
}

function formatSearchLabel(result: NominatimResult): string {
  const a = result.address;
  if (a) {
    const street = [a.house_number, a.road].filter(Boolean).join(' ') || a.neighbourhood;
    const city = a.city || a.town || a.village || '';
    if (street && city) return `${street}, ${city}`;
    if (street) return street;
    if (city) return city;
  }
  return result.display_name.split(',').slice(0, 2).join(',').trim();
}

function formatSearchDetail(result: NominatimResult): string {
  const parts = result.display_name.split(',').map((p) => p.trim());
  if (parts.length <= 2) return parts[parts.length - 1] ?? '';
  return parts.slice(2, 5).join(', ');
}

function suggestZoom(result: NominatimResult): number {
  const kind = result.addresstype || result.type || result.class || '';
  if (['house', 'building', 'residential', 'address'].includes(kind)) return 18;
  if (['road', 'highway', 'street', 'pedestrian'].includes(kind)) return 17;
  if (['city', 'town', 'village', 'hamlet'].includes(kind)) return 13;
  if (['state', 'region', 'county'].includes(kind)) return 9;
  return 16;
}

/** Detailed address for map pin — better for routing than city-only. */
function formatPinAddress(result: NominatimResult): string {
  const a = result.address;
  if (a) {
    const area = a.road || a.neighbourhood || a.suburb || '';
    const city = a.city || a.town || a.village || '';
    const parts = [area, city, a.state, a.country].filter(Boolean);
    if (parts.length >= 2) return parts.join(', ');
    if (parts.length === 1) return parts[0]!;
  }
  return result.display_name.split(',').slice(0, 4).join(',').trim();
}

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({
    q,
    format: 'json',
    addressdetails: '1',
    limit: '8',
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    { headers: NOMINATIM_HEADERS },
  );

  if (!response.ok) return [];

  const data = (await response.json()) as NominatimResult[];
  return data.map((item) => ({
    id: String(item.place_id),
    label: formatSearchLabel(item),
    detail: formatSearchDetail(item),
    fullName: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    zoom: suggestZoom(item),
  }));
}

export async function geocodeToCoords(query: string): Promise<[number, number] | null> {
  const results = await searchPlaces(query);
  if (results.length === 0) return null;
  return [results[0].lat, results[0].lng];
}

export async function reverseGeocodeCoords(lat: number, lng: number): Promise<string> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'json',
    addressdetails: '1',
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params}`,
    { headers: NOMINATIM_HEADERS },
  );

  if (!response.ok) throw new Error('Could not look up this location.');

  const data = (await response.json()) as NominatimResult;
  const name = formatPinAddress(data);
  if (!name) throw new Error('Could not find an address here.');
  return name;
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS is not supported in this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60_000,
    });
  });
}

export const DEFAULT_MAP_CENTER: [number, number] = [20.5937, 78.9629];

const MIN_PIN_ZOOM = 14;

const INDIAN_STATES_AND_UTS = new Set([
  'andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh',
  'goa', 'gujarat', 'haryana', 'himachal pradesh', 'jharkhand', 'karnataka',
  'kerala', 'madhya pradesh', 'maharashtra', 'manipur', 'meghalaya', 'mizoram',
  'nagaland', 'odisha', 'punjab', 'rajasthan', 'sikkim', 'tamil nadu',
  'telangana', 'tripura', 'uttar pradesh', 'uttarakhand', 'west bengal',
  'andaman and nicobar islands', 'chandigarh',
  'dadra and nagar haveli and daman and diu', 'delhi', 'jammu and kashmir',
  'ladakh', 'lakshadweep', 'puducherry',
]);

/** True when the label is only a state/region (e.g. "Uttar Pradesh, India"). */
export function isVagueAddress(address: string): boolean {
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 3) return false;
  if (parts.length === 0) return true;

  const country = parts[parts.length - 1]?.toLowerCase();
  if (country !== 'india' && country !== 'in') return false;

  const locality = (parts[0] ?? address).toLowerCase();
  if (/\d/.test(locality)) return false;

  const specific =
    /\b(road|street|nagar|colony|village|ward|lane|highway|marg|chowk|bazar|bazaar|taluka|tehsil)\b/i;
  if (specific.test(locality)) return false;

  return INDIAN_STATES_AND_UTS.has(locality);
}

export function minZoomForPin(): number {
  return MIN_PIN_ZOOM;
}
