import { useEffect, useRef } from 'react';

interface Marker { lat: number; lng: number; color?: string; label?: string }
interface Props { center: [number, number]; zoom?: number; markers?: Marker[]; height?: number; drawLine?: boolean }

// CDN URLs to avoid bundler icon path issues
const ICON_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const ICON_2X = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const SHADOW = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

let leafletCssLoaded = false;
function ensureLeafletCss() {
  if (leafletCssLoaded) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
  leafletCssLoaded = true;
}

export function LeafletMap({ center, zoom = 15, markers = [], height = 200, drawLine = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    ensureLeafletCss();
    import('leaflet').then(L => {
      if (!containerRef.current || mapRef.current) return;

      // Fix default icon
      (L.Icon.Default as any).mergeOptions({ iconUrl: ICON_URL, iconRetinaUrl: ICON_2X, shadowUrl: SHADOW });
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: false }).setView(center, zoom);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const addedLatLngs: [number, number][] = [];

      markers.forEach(m => {
        const icon = m.color ? L.divIcon({
          html: `<div style="width:14px;height:14px;background:${m.color};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
          className: '',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        }) : new L.Icon.Default();

        const marker = L.marker([m.lat, m.lng], { icon });
        if (m.label) marker.bindPopup(m.label);
        marker.addTo(map);
        addedLatLngs.push([m.lat, m.lng]);
      });

      if (drawLine && addedLatLngs.length >= 2) {
        L.polyline(addedLatLngs, { color: '#A67B1A', weight: 2, dashArray: '6 4' }).addTo(map);
      }

      if (addedLatLngs.length > 1) {
        map.fitBounds(addedLatLngs as any, { padding: [30, 30] });
      }
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%', borderRadius: 10, overflow: 'hidden', border: '1px solid #E8E7E4', background: '#f0efec' }}
    />
  );
}
