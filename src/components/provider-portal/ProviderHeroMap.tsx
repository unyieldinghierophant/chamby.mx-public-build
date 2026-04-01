import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const GDL: [number, number] = [20.6736, -103.344];
const BASE_ZOOM = 12;
const FOCUS_ZOOM = 14;
const CYCLE_MS = 10_000;   // 10s per job cycle
const DWELL_MS = 7_000;    // label visible for 7s
const FLY_IN_S = 2.0;
const FLY_OUT_S = 2.5;
const MAX_DOTS = 5;

const TILE = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

// lat/lng are the actual neighborhood centers in Guadalajara metro
const JOBS = [
  { title: "Cortar pasto",                icon: "🌿", zone: "Zapopan",          lat: 20.7167, lng: -103.3940 },
  { title: "Instalar aire acondicionado", icon: "❄️",  zone: "Providencia",      lat: 20.6833, lng: -103.3833 },
  { title: "Pintar recámara",             icon: "🖌️", zone: "Chapalita",         lat: 20.6761, lng: -103.4028 },
  { title: "Reparar fuga de agua",        icon: "🔧", zone: "Centro",            lat: 20.6736, lng: -103.3440 },
  { title: "Instalación eléctrica",       icon: "⚡", zone: "Tlaquepaque",       lat: 20.6422, lng: -103.3106 },
  { title: "Plomería general",            icon: "💧", zone: "Americana",         lat: 20.6700, lng: -103.3720 },
  { title: "Cambiar cerradura",           icon: "🔑", zone: "Tonalá",            lat: 20.6239, lng: -103.2344 },
  { title: "Instalar calentador",         icon: "🔥", zone: "Santa Tere",        lat: 20.6700, lng: -103.3556 },
  { title: "Montar muebles",              icon: "🪑", zone: "Puerta de Hierro",  lat: 20.7000, lng: -103.4200 },
  { title: "Impermeabilizar techo",       icon: "🏠", zone: "Miravalle",         lat: 20.6450, lng: -103.3450 },
  { title: "Podar árboles",              icon: "🌳", zone: "Bugambilias",       lat: 20.7050, lng: -103.3950 },
  { title: "Reparar tinaco",             icon: "🪣", zone: "La Estancia",       lat: 20.7100, lng: -103.4100 },
  { title: "Limpieza profunda",          icon: "✨", zone: "Col. de San Javier", lat: 20.7183, lng: -103.4200 },
  { title: "Pulir pisos",               icon: "⭐", zone: "Zapopan Norte",      lat: 20.7300, lng: -103.4000 },
];

export interface JobInfo {
  title: string;
  icon: string;
  zone: string;
}

interface Props {
  onReady?: () => void;
  onJobEnter?: (job: JobInfo) => void;
  onJobExit?: () => void;
}

function randomPointNear(lat: number, lng: number, spread = 0.012): [number, number] {
  return [
    lat + (Math.random() - 0.5) * spread,
    lng + (Math.random() - 0.5) * spread,
  ];
}

export const ProviderHeroMap = ({ onReady, onJobEnter, onJobExit }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Refs for callbacks so the effect closure is never stale
  const onJobEnterRef = useRef(onJobEnter);
  const onJobExitRef = useRef(onJobExit);
  useEffect(() => { onJobEnterRef.current = onJobEnter; }, [onJobEnter]);
  useEffect(() => { onJobExitRef.current = onJobExit; }, [onJobExit]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Inject blip-dot CSS (scoped with cb- prefix to avoid leaking)
    const styleEl = document.createElement("style");
    styleEl.textContent = `
      .cb-blip { position:relative; width:40px; height:40px; }
      .cb-blip-core {
        position:absolute; top:50%; left:50%;
        transform:translate(-50%,-50%);
        width:10px; height:10px; background:#2563EB; border-radius:50%;
        border:2.5px solid white; box-shadow:0 2px 8px rgba(37,99,235,0.4); z-index:2;
      }
      .cb-blip-ring {
        position:absolute; top:50%; left:50%;
        width:40px; height:40px; border-radius:50%;
        background:rgba(37,99,235,0.12);
        animation:cbRing 2.5s ease-out infinite; z-index:1;
      }
      .cb-blip-ring-2 { animation-delay:0.8s; }
      @keyframes cbRing {
        0%   { transform:translate(-50%,-50%) scale(0.4); opacity:0.6; }
        100% { transform:translate(-50%,-50%) scale(2.2); opacity:0; }
      }
    `;
    document.head.appendChild(styleEl);

    const map = L.map(containerRef.current, {
      center: GDL,
      zoom: BASE_ZOOM,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      boxZoom: false,
      keyboard: false,
      zoomAnimation: true,
      fadeAnimation: true,
    });

    L.tileLayer(TILE, { subdomains: "abcd", maxZoom: 18 }).addTo(map);

    // Desaturated blue-grey tint matching the HTML reference
    map.whenReady(() => {
      const pane = map.getPanes().tilePane as HTMLElement | null;
      if (pane) {
        pane.style.filter =
          "saturate(0.2) brightness(1.04) contrast(0.9) hue-rotate(200deg)";
      }
    });

    // ── Blip dots ──
    const dots: L.Marker[] = [];

    function blipIcon(): L.DivIcon {
      return L.divIcon({
        className: "",
        html: `<div class="cb-blip">
          <div class="cb-blip-ring"></div>
          <div class="cb-blip-ring cb-blip-ring-2"></div>
          <div class="cb-blip-core"></div>
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
    }

    function addDot(pos: [number, number]) {
      if (dots.length >= MAX_DOTS) {
        const old = dots.shift()!;
        const el = old.getElement();
        if (el) {
          el.style.transition = "opacity 0.6s";
          el.style.opacity = "0";
        }
        setTimeout(() => map.removeLayer(old), 650);
      }
      dots.push(
        L.marker(pos, { icon: blipIcon(), interactive: false }).addTo(map)
      );
    }

    // ── Job queue ──
    let queue = [...JOBS].sort(() => Math.random() - 0.5);
    let qi = 0;
    function nextJob(): JobInfo {
      const j = queue[qi];
      qi = (qi + 1) % queue.length;
      if (qi === 0) queue = [...JOBS].sort(() => Math.random() - 0.5);
      return j;
    }

    // ── Cycle timers ──
    const timers: ReturnType<typeof setTimeout>[] = [];
    let intervalId: ReturnType<typeof setInterval> | null = null;

    function showJob() {
      const job = nextJob();
      const pos = randomPointNear(job.lat, job.lng);

      addDot(pos);
      map.flyTo(pos, FOCUS_ZOOM, { duration: FLY_IN_S, easeLinearity: 0.15 });

      // Show label after fly-in completes
      const t1 = setTimeout(() => {
        onJobEnterRef.current?.(job);
      }, FLY_IN_S * 1000 + 200);
      timers.push(t1);

      // Hide label + start fly-out back to GDL overview
      const t2 = setTimeout(() => {
        onJobExitRef.current?.();
        const t3 = setTimeout(() => {
          map.flyTo(GDL, BASE_ZOOM, { duration: FLY_OUT_S, easeLinearity: 0.15 });
        }, 500);
        timers.push(t3);
      }, FLY_IN_S * 1000 + 200 + DWELL_MS);
      timers.push(t2);
    }

    // Start first job after 1.8s, then repeat every CYCLE_MS
    const startTimer = setTimeout(() => {
      showJob();
      intervalId = setInterval(showJob, CYCLE_MS);
    }, 1800);

    onReady?.();

    return () => {
      clearTimeout(startTimer);
      timers.forEach(clearTimeout);
      if (intervalId) clearInterval(intervalId);
      map.remove();
      document.head.removeChild(styleEl);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className="absolute inset-0" />;
};
