import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, MapPin, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// ─── Config ──────────────────────────────────────────────────
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
const GDL_FALLBACK = { lat: 20.6597, lng: -103.3496 };
const CYCLE_MS = 3800;

// Mock provider offsets (applied to the geocoded home position)
const MOCK_OFFSETS = [
  { dLat:  0.0049, dLng: -0.0053, name: 'Jorge R.',   stars: '★★★★★', rating: '4.9', spec: 'Técnico',    eta: '8 min'  },
  { dLat: -0.0041, dLng:  0.0082, name: 'Carlos V.',  stars: '★★★★☆', rating: '4.7', spec: 'Técnico',    eta: '13 min' },
  { dLat:  0.0032, dLng: -0.0128, name: 'María G.',   stars: '★★★★★', rating: '4.8', spec: 'Técnica',    eta: '11 min' },
  { dLat: -0.0077, dLng: -0.0011, name: 'Roberto M.', stars: '★★★★☆', rating: '4.6', spec: 'Técnico',    eta: '17 min' },
  { dLat:  0.0078, dLng:  0.0062, name: 'Ana L.',     stars: '★★★★★', rating: '4.9', spec: 'Técnica',    eta: '19 min' },
];

const MESSAGES = [
  { text: 'Notificando técnicos cercanos…',   sub: '5 disponibles en tu zona ahora',         amber: false },
  { text: 'Jorge revisó tu solicitud',         sub: 'Evaluando disponibilidad · 8 min',        amber: false },
  { text: 'Tiempo promedio de respuesta',      sub: 'Los técnicos aceptan en ~4 minutos',      amber: true  },
  { text: 'Carlos está revisando tu pedido',   sub: 'Técnico verificado · 13 min',             amber: false },
  { text: '3 técnicos notificados',            sub: 'Esperando confirmación…',                 amber: false },
  { text: 'María vio tu solicitud',            sub: 'Proveedora con 98 % de aceptación',       amber: false },
  { text: 'Tu pago está seguro',               sub: '$406 MXN en escrow · sin cargos aún',    amber: true  },
  { text: 'Casi listo…',                       sub: 'Los técnicos suelen confirmar en <5 min', amber: false },
];

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'all',           elementType: 'labels.icon',       stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry',          stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'labels.text.fill',  stylers: [{ color: '#9a9890' }] },
  { featureType: 'landscape',      elementType: 'geometry',          stylers: [{ color: '#f0efe8' }] },
  { featureType: 'poi',            elementType: 'geometry',          stylers: [{ color: '#e4e3db' }] },
  { featureType: 'poi',            elementType: 'labels',            stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park',       elementType: 'geometry',          stylers: [{ color: '#d4dfc4' }] },
  { featureType: 'road',           elementType: 'geometry',          stylers: [{ color: '#ffffff' }] },
  { featureType: 'road',           elementType: 'geometry.stroke',   stylers: [{ color: '#e8e8e0' }, { weight: 0.5 }] },
  { featureType: 'road',           elementType: 'labels.text.fill',  stylers: [{ color: '#b0b0a8' }] },
  { featureType: 'road.arterial',  elementType: 'geometry',          stylers: [{ color: '#ffffff' }, { weight: 1.5 }] },
  { featureType: 'road.highway',   elementType: 'geometry',          stylers: [{ color: '#ffffff' }, { weight: 2 }] },
  { featureType: 'transit',        elementType: 'all',               stylers: [{ visibility: 'off' }] },
  { featureType: 'water',          elementType: 'geometry',          stylers: [{ color: '#dce8f0' }] },
];

// ─── Singleton loader (shared with EsperandoProveedor) ───────
let _mapsPromise: Promise<void> | null = null;
function loadGoogleMaps(): Promise<void> {
  if ((window as any).google?.maps) return Promise.resolve();
  if (_mapsPromise) return _mapsPromise;
  _mapsPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      if ((window as any).google?.maps) { resolve(); return; }
      existing.addEventListener('load', () => resolve());
      return;
    }
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,marker`;
    s.async = true;
    s.defer = true;
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error('Google Maps failed to load'));
    document.head.appendChild(s);
  });
  return _mapsPromise;
}

// ─── Marker HTML helpers ──────────────────────────────────────
const homeMarkerHtml = `
<div style="display:flex;flex-direction:column;align-items:center;">
  <div style="width:42px;height:42px;border-radius:50%;background:#0F0F0E;border:3px solid white;box-shadow:0 4px 14px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 1L1 9h2v9h4v-5h6v5h4V9h2L10 1z"/>
    </svg>
  </div>
  <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #0F0F0E;margin-top:-1px;"></div>
  <div style="width:14px;height:5px;border-radius:50%;background:rgba(0,0,0,0.14);margin-top:2px;"></div>
</div>`;

function providerMarkerHtml(active: boolean, idx: number) {
  return `
<div id="pmw${idx}" style="display:flex;flex-direction:column;align-items:center;transform:${active ? 'scale(1.15)' : 'scale(1)'};transition:transform 0.3s ease;">
  <div id="pb${idx}" style="border-radius:50%;background:${active ? '#0D9E6A' : 'white'};border:2.5px solid ${active ? '#0D9E6A' : '#C8C8C0'};box-shadow:${active ? '0 5px 18px rgba(13,158,106,0.45)' : '0 3px 10px rgba(0,0,0,0.16)'};display:flex;align-items:center;justify-content:center;width:${active ? '42px' : '36px'};height:${active ? '42px' : '36px'};transition:all 0.3s ease;">
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="${active ? 'white' : '#A0A098'}" stroke-width="1.8" stroke-linecap="round">
      <circle cx="10" cy="6.5" r="3.5"/>
      <path d="M3 18c0-3.9 3.1-7 7-7s7 3.1 7 7"/>
    </svg>
  </div>
  <div id="pt${idx}" style="width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid ${active ? '#0D9E6A' : '#C8C8C0'};margin-top:-1px;transition:border-top-color 0.3s;"></div>
</div>`;
}

// ─── Component ────────────────────────────────────────────────
interface Props {
  job: {
    id: string;
    status: string;
    location?: string | null;
    provider?: { full_name: string } | null;
  };
  onTransition: (status: string) => void;
}

export const SearchingForProvider = ({ job, onTransition }: Props) => {
  const navigate = useNavigate();
  const mapContainerRef  = useRef<HTMLDivElement>(null);
  const mapRef           = useRef<google.maps.Map | null>(null);
  const homePosRef       = useRef<{ lat: number; lng: number }>(GDL_FALLBACK);
  const markerObjsRef    = useRef<any[]>([]);
  const activeRouteRef   = useRef<google.maps.Polyline | null>(null);
  const cycleTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const [mapReady,         setMapReady        ] = useState(false);
  const [activeIdx,        setActiveIdx       ] = useState(0);
  const [msgIdx,           setMsgIdx          ] = useState(0);
  const [msgVisible,       setMsgVisible      ] = useState(false);
  const [focusCardVisible, setFocusCardVisible] = useState(false);
  const [focusedProvider,  setFocusedProvider ] = useState(MOCK_OFFSETS[0]);
  const [etaText,          setEtaText         ] = useState<string | null>(null);
  const [notifyOpen,       setNotifyOpen      ] = useState(false);
  const [notifyPhone,      setNotifyPhone     ] = useState('');
  const [saving,           setSaving          ] = useState(false);
  const [cancelling,       setCancelling      ] = useState(false);

  const isAccepted = job.status === 'assigned';
  const jobShortId = job.id.slice(0, 8).toUpperCase();

  // ── Init map ─────────────────────────────────────────────
  useEffect(() => {
    if (isAccepted) return;
    let cancelled = false;

    loadGoogleMaps().then(() => {
      if (cancelled || !mapContainerRef.current || mapRef.current) return;

      const map = new google.maps.Map(mapContainerRef.current, {
        center: GDL_FALLBACK,
        zoom: 14,
        mapId: 'DEMO_MAP_ID',
        styles: MAP_STYLES,
        disableDefaultUI: true,
        gestureHandling: 'none',
        keyboardShortcuts: false,
        backgroundColor: '#f0efe8',
      });
      mapRef.current = map;

      const placeHome = (pos: { lat: number; lng: number }) => {
        homePosRef.current = pos;
        map.setCenter(pos);
        map.setZoom(15);

        const el = document.createElement('div');
        el.innerHTML = homeMarkerHtml;
        new (google.maps.marker as any).AdvancedMarkerElement({ map, position: pos, content: el, zIndex: 10 });

        // Place mock provider markers
        const mockProviders = MOCK_OFFSETS.map((o, i) => ({
          ...o,
          lat: pos.lat + o.dLat,
          lng: pos.lng + o.dLng,
        }));

        markerObjsRef.current = mockProviders.map((p, i) => {
          const el = document.createElement('div');
          el.innerHTML = providerMarkerHtml(i === 0, i);
          return new (google.maps.marker as any).AdvancedMarkerElement({
            map, position: { lat: p.lat, lng: p.lng }, content: el, zIndex: i === 0 ? 20 : 5,
          });
        });

        setMapReady(true);
      };

      if (job.location) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: job.location }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            const loc = results[0].geometry.location;
            placeHome({ lat: loc.lat(), lng: loc.lng() });
          } else {
            placeHome(GDL_FALLBACK);
          }
        });
      } else {
        placeHome(GDL_FALLBACK);
      }
    }).catch(console.error);

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Provider cycling ─────────────────────────────────────
  const focusProvider = useCallback((idx: number) => {
    if (!mapRef.current) return;
    const home = homePosRef.current;
    const offset = MOCK_OFFSETS[idx];
    const provPos = { lat: home.lat + offset.dLat, lng: home.lng + offset.dLng };

    // Update all marker visuals
    markerObjsRef.current.forEach((m, i) => {
      const el = document.createElement('div');
      el.innerHTML = providerMarkerHtml(i === idx, i);
      m.content = el;
      m.zIndex  = i === idx ? 20 : 5;
    });

    // Fit bounds to show home + provider
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(home);
    bounds.extend(provPos);
    mapRef.current.fitBounds(bounds, { top: 40, bottom: 100, left: 40, right: 40 });

    // Clear old route
    if (activeRouteRef.current) { activeRouteRef.current.setMap(null); activeRouteRef.current = null; }

    // Draw dashed route
    const ds = new google.maps.DirectionsService();
    ds.route({ origin: provPos, destination: home, travelMode: google.maps.TravelMode.DRIVING }, (result, status) => {
      if (status === 'OK' && result) {
        activeRouteRef.current = new google.maps.Polyline({
          path: result.routes[0].overview_path,
          strokeColor: '#0D9E6A',
          strokeOpacity: 0,
          strokeWeight: 3,
          icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.7, scale: 3 }, offset: '0', repeat: '12px' }],
          map: mapRef.current!,
        });
        const dur = result.routes[0]?.legs[0]?.duration;
        if (dur) setEtaText(dur.text);
      }
    });

    // Update focus card
    setFocusedProvider(MOCK_OFFSETS[idx]);
    setFocusCardVisible(false);
    setTimeout(() => setFocusCardVisible(true), 80);
    setMsgIdx(idx % MESSAGES.length);
  }, []);

  useEffect(() => {
    if (!mapReady || isAccepted) return;

    // Show first message
    setTimeout(() => {
      setMsgVisible(true);
      focusProvider(0);
    }, 600);

    // Cycle every CYCLE_MS
    let cycleIdx = 0;
    cycleTimerRef.current = setInterval(() => {
      cycleIdx = (cycleIdx + 1) % MOCK_OFFSETS.length;
      setActiveIdx(cycleIdx);
      focusProvider(cycleIdx);
    }, CYCLE_MS);

    return () => {
      if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);
    };
  }, [mapReady, isAccepted, focusProvider]);

  // ── Stop cycle on acceptance ──────────────────────────────
  useEffect(() => {
    if (isAccepted && cycleTimerRef.current) {
      clearInterval(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }
  }, [isAccepted]);

  // ── Actions ───────────────────────────────────────────────
  const handleCancel = async () => {
    if (!confirm('¿Cancelar esta solicitud?')) return;
    setCancelling(true);
    await supabase.from('jobs').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', job.id);
    setCancelling(false);
    navigate(-1);
  };

  const handleSavePhone = async () => {
    if (!notifyPhone.trim()) return;
    setSaving(true);
    await supabase.from('jobs').update({
      description: ((job as any).description || '') + `\n[Notificar al: ${notifyPhone.trim()}]`,
    }).eq('id', job.id);
    setSaving(false);
    setNotifyOpen(false);
  };

  const msg = MESSAGES[msgIdx];
  const provider = MOCK_OFFSETS[activeIdx];

  return (
    <div
      className="flex flex-col bg-[#FAFAF8]"
      style={{ fontFamily: "'DM Sans', sans-serif", WebkitFontSmoothing: 'antialiased' }}
    >

      {/* ── Nav bar ── */}
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-2.5 bg-[#FAFAF8] flex-shrink-0 z-20">
        <button
          onClick={() => navigate(-1)}
          className="w-[34px] h-[34px] rounded-full bg-[#F5F5F2] border border-[#E0E0DA] flex items-center justify-center flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4 text-[#0F0F0E]" />
        </button>
        <span className="text-[15px] font-semibold text-[#0F0F0E]">Buscando técnico</span>
        <div className="ml-auto bg-[#F5F5F2] border border-[#E0E0DA] rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#686860]">
          #{jobShortId}
        </div>
      </div>

      {/* ── Map area ── */}
      <div className="relative flex-shrink-0" style={{ height: 360 }}>
        <div ref={mapContainerRef} className="w-full h-full bg-[#f0efe8]" />

        {/* Floating message bar */}
        <div className="absolute top-3 left-3 right-3 z-[15] pointer-events-none">
          <AnimatePresence mode="wait">
            {msgVisible && !isAccepted && (
              <motion.div
                key={msgIdx}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.35 }}
                className="bg-white rounded-[14px] px-3.5 py-2.5 flex items-center gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.14)] border border-black/[0.06]"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background: msg.amber ? '#E8A020' : '#0D9E6A',
                    animation: msg.amber ? 'none' : 'sfp-pulse 1.4s ease-in-out infinite',
                  }}
                />
                <div>
                  <div className="text-[12px] font-semibold text-[#0F0F0E] leading-snug">{msg.text}</div>
                  <div className="text-[11px] text-[#686860] mt-px">{msg.sub}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Provider focus card */}
        <AnimatePresence>
          {focusCardVisible && !isAccepted && (
            <motion.div
              key="focusCard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="absolute z-[15] left-3 right-3 flex items-center gap-3 bg-white rounded-2xl px-3.5 py-3 shadow-[0_6px_24px_rgba(0,0,0,0.16)] border border-black/[0.06] pointer-events-none"
              style={{ bottom: 88 }}
            >
              <div className="w-10 h-10 rounded-full bg-[#E6F7F1] flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#0D9E6A" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="10" cy="6.5" r="3.5"/><path d="M3 18c0-3.9 3.1-7 7-7s7 3.1 7 7"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-[#0F0F0E]">{focusedProvider.name}</div>
                <div className="text-[11px] text-[#686860] mt-px">
                  {focusedProvider.stars} {focusedProvider.rating} · {focusedProvider.spec}
                </div>
              </div>
              <div className="ml-auto flex-shrink-0 bg-[#E6F7F1] text-[#0A7A52] rounded-full px-2.5 py-1 text-[12px] font-bold">
                {etaText ?? focusedProvider.eta}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Accepted overlay */}
        <AnimatePresence>
          {isAccepted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2.5"
              style={{ background: 'rgba(13,158,106,0.92)' }}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ border: '2.5px solid rgba(255,255,255,0.4)' }}
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 14l6.5 6.5L23 7"/>
                </svg>
              </motion.div>
              <div className="text-[18px] font-bold text-white">¡Técnico aceptó!</div>
              <div className="text-[13px] text-white/80">
                {job.provider?.full_name ? `${job.provider.full_name} está en camino` : 'Tu técnico está en camino'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to top, #FAFAF8 0%, transparent 100%)' }}
        />
      </div>

      {/* ── Bottom sheet ── */}
      <div className="flex-1 bg-[#FAFAF8] flex flex-col overflow-hidden z-20">
        {/* Handle */}
        <div className="w-9 h-1 rounded-full bg-[#C8C8C0] mx-auto mt-2.5 mb-3.5 flex-shrink-0" />

        {/* Scrollable content */}
        <div className="px-4 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {/* Status pill */}
          <div className="inline-flex items-center gap-1.5 bg-[#E6F7F1] rounded-full px-3 py-[5px] mb-2.5">
            <div
              className="w-2 h-2 rounded-full bg-[#0D9E6A] flex-shrink-0"
              style={{ animation: 'sfp-pulse 1.4s ease-in-out infinite' }}
            />
            <span className="text-[12px] font-semibold text-[#0A7A52]">5 técnicos en tu zona</span>
          </div>

          <div className="text-[20px] font-bold text-[#0F0F0E] mb-1">Buscando tu técnico</div>
          <div className="text-[13px] text-[#686860] leading-relaxed mb-3.5">
            Notificamos a los proveedores más cercanos. Suelen responder en menos de 5 minutos.
          </div>

          {/* Steps */}
          <div className="flex flex-col">
            {/* Step 1 */}
            <div className="flex items-center gap-2.5 py-[9px] border-b border-[#E0E0DA]">
              <div className="w-7 h-7 rounded-full bg-[#0D9E6A] flex items-center justify-center flex-shrink-0">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M2 6.5l3 3 6-6"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[#0F0F0E]">Solicitud creada</div>
                <div className="text-[11px] text-[#A0A098] mt-px">Job #{jobShortId}</div>
              </div>
              <div className="text-[11px] font-semibold text-[#0D9E6A] flex-shrink-0">Listo</div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-2.5 py-[9px] border-b border-[#E0E0DA]">
              <div className="w-7 h-7 rounded-full bg-[#0D9E6A] flex items-center justify-center flex-shrink-0">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M2 6.5l3 3 6-6"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[#0F0F0E]">Pago en escrow</div>
                <div className="text-[11px] text-[#A0A098] mt-px">$406 MXN retenidos</div>
              </div>
              <div className="text-[11px] font-semibold text-[#0D9E6A] flex-shrink-0">Seguro</div>
            </div>

            {/* Step 3 — active */}
            <div className="flex items-center gap-2.5 py-[9px] border-b border-[#E0E0DA]">
              <div className="w-7 h-7 rounded-full bg-[#0F0F0E] flex items-center justify-center flex-shrink-0">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 4v2.5l1.5 1.5"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[#0F0F0E]">Notificando técnicos</div>
                <div className="text-[11px] text-[#A0A098] mt-px">5 proveedores cerca</div>
              </div>
              <div className="text-[11px] font-semibold text-[#E8A020] flex-shrink-0">En curso</div>
            </div>

            {/* Step 4 — pending */}
            <div className="flex items-center gap-2.5 py-[9px] opacity-[0.38]">
              <div className="w-7 h-7 rounded-full bg-[#E0E0DA] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[#0F0F0E]">Técnico en camino</div>
                <div className="text-[11px] text-[#A0A098] mt-px">Recibirás una notificación</div>
              </div>
              <div className="text-[11px] font-semibold text-[#A0A098] flex-shrink-0">Pendiente</div>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="px-4 pt-2.5 pb-7 flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={() => setNotifyOpen(true)}
            className="w-full py-[14px] rounded-full bg-[#0F0F0E] text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
          >
            <MapPin className="w-[15px] h-[15px]" />
            Avísame cuando haya un técnico
          </button>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full py-[14px] rounded-full border border-[#C8C8C0] bg-transparent text-[14px] font-semibold text-[#686860] transition-colors hover:border-[#0F0F0E] hover:text-[#0F0F0E] disabled:opacity-50"
          >
            {cancelling ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Cancelar solicitud'}
          </button>
        </div>
      </div>

      {/* ── Notify modal ── */}
      <AnimatePresence>
        {notifyOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(15,15,14,0.5)' }}
              onClick={() => setNotifyOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#FAFAF8] rounded-[28px_28px_0_0] px-5 pb-8"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <div className="w-9 h-1 rounded-full bg-[#C8C8C0] mx-auto mt-3 mb-[18px]" />
              <div className="text-[18px] font-bold text-[#0F0F0E] mb-1.5">¿A dónde te avisamos?</div>
              <div className="text-[13px] text-[#686860] leading-relaxed mb-[18px]">
                Te mandamos mensaje en cuanto un técnico acepte. Normalmente tarda menos de 10 minutos.
              </div>
              <input
                type="tel"
                inputMode="tel"
                placeholder="WhatsApp o número de teléfono"
                value={notifyPhone}
                onChange={e => setNotifyPhone(e.target.value)}
                className="w-full border border-[#C8C8C0] rounded-xl px-[14px] py-[13px] text-[15px] text-[#0F0F0E] bg-[#FAFAF8] outline-none mb-3 focus:border-[#0F0F0E] transition-colors"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              />
              <button
                onClick={handleSavePhone}
                disabled={saving || !notifyPhone.trim()}
                className="w-full py-[14px] rounded-full bg-[#0F0F0E] text-white text-[14px] font-semibold mb-2.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Confirmar — avísame'}
              </button>
              <button
                onClick={() => setNotifyOpen(false)}
                className="w-full text-[13px] text-[#A0A098] py-1.5 text-center"
              >
                Ahora no
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Keyframe animations ── */}
      <style>{`
        @keyframes sfp-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.6); }
        }
      `}</style>
    </div>
  );
};
