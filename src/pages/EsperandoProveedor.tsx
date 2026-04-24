import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { GenericPageSkeleton } from "@/components/skeletons";
import { RotateCcw, MessageCircle, Loader2, ChevronLeft } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const ASSIGNMENT_WINDOW_MINUTES = 20;
const CYCLE_INTERVAL_MS = 3800;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GDL_CENTER = { lat: 20.6597, lng: -103.3496 };

const MOCK_OFFSETS = [
  { dLat:  0.0049, dLng: -0.0053, display_name: 'Jorge R.',   rating: 4.9 },
  { dLat: -0.0041, dLng:  0.0082, display_name: 'Carlos V.',  rating: 4.7 },
  { dLat:  0.0032, dLng: -0.0128, display_name: 'María G.',   rating: 4.8 },
  { dLat: -0.0077, dLng: -0.0011, display_name: 'Roberto M.', rating: 4.6 },
  { dLat:  0.0078, dLng:  0.0062, display_name: 'Ana L.',     rating: 4.9 },
];

interface NearbyProvider {
  user_id: string;
  display_name: string | null;
  rating: number | null;
  avatar_url: string | null;
  current_latitude: number;
  current_longitude: number;
  skills: string[] | null;
}

// ─── Google Maps loader (singleton) ─────────────────────────
let gMapsPromise: Promise<void> | null = null;
function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps?.places) return Promise.resolve();
  if (gMapsPromise) return gMapsPromise;
  gMapsPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return; }
    const existing = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existing) { existing.addEventListener("load", () => resolve()); return; }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,marker`;
    s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Google Maps failed"));
    document.head.appendChild(s);
  });
  return gMapsPromise;
}

// ─── Map styles (matches HTML design) ───────────────────────
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "all", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#9a9890" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f0efe8" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#e4e3db" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#d4dfc4" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e8e8e0" }, { weight: 0.5 }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#b0b0a8" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#ffffff" }, { weight: 1.5 }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ffffff" }, { weight: 2 }] },
  { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#dce8f0" }] },
];

// ─── Rotating messages ───────────────────────────────────────
const MESSAGES = [
  { text: "Notificando técnicos cercanos…", sub: "Verificando disponibilidad en tu zona", amber: false },
  { text: "Conectando con especialistas verificados…", sub: "Técnicos con más de 50 trabajos completados", amber: false },
  { text: "Tiempo promedio de respuesta", sub: "Los técnicos aceptan en ~4 minutos", amber: true },
  { text: "Tu pago está seguro", sub: "$406 MXN en escrow · sin cargos aún", amber: true },
  { text: "Casi listo…", sub: "Los técnicos suelen confirmar en menos de 5 min", amber: false },
];

// ─── SVG marker HTML builders ────────────────────────────────
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

const providerMarkerHtml = (active: boolean) => `
<div style="display:flex;flex-direction:column;align-items:center;transform:${active ? "scale(1.15)" : "scale(1)"};transition:transform 0.3s ease;">
  <div style="border-radius:50%;background:${active ? "#0D9E6A" : "white"};border:2.5px solid ${active ? "#0D9E6A" : "#C8C8C0"};box-shadow:${active ? "0 5px 18px rgba(13,158,106,0.45)" : "0 3px 10px rgba(0,0,0,0.16)"};display:flex;align-items:center;justify-content:center;width:${active ? "42px" : "36px"};height:${active ? "42px" : "36px"};transition:all 0.3s ease;">
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="${active ? "white" : "#A0A098"}" stroke-width="1.8" stroke-linecap="round">
      <circle cx="10" cy="6.5" r="3.5"/>
      <path d="M3 18c0-3.9 3.1-7 7-7s7 3.1 7 7"/>
    </svg>
  </div>
  <div style="width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid ${active ? "#0D9E6A" : "#C8C8C0"};margin-top:-1px;transition:border-top-color 0.3s;"></div>
</div>`;

const EsperandoProveedor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("job_id");

  // ── Core state ──
  const [verifying, setVerifying] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [acceptedProvider, setAcceptedProvider] = useState<NearbyProvider | null>(null);

  // ── Map / provider state ──
  const [providers, setProviders] = useState<NearbyProvider[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [etaText, setEtaText] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [focusCardVisible, setFocusCardVisible] = useState(false);

  // ── Notify modal ──
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyPhone, setNotifyPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  // ── Refs ──
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const homeMarkerRef = useRef<any>(null);
  const providerMarkersRef = useRef<any[]>([]);
  const activeRouteRef = useRef<google.maps.Polyline | null>(null);
  const cycleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const homePosRef = useRef<google.maps.LatLng | null>(null);

  const activeProv = providers[activeIdx] ?? null;

  // ══════════════════════════════════════════════════════════════
  // FETCH JOB
  // ══════════════════════════════════════════════════════════════
  const fetchJob = useCallback(async () => {
    if (!jobId) { setVerifying(false); return; }
    const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).single();

    if (error || !data) { toast.error("No se encontró la solicitud"); navigate("/user-landing"); return; }

    if (data.status === "accepted" || data.status === "confirmed" || data.status === "assigned") {
      setJob(data); setAccepted(true);
      if (data.provider_id) {
        const { data: prov } = await supabase.from("providers")
          .select("user_id, display_name, rating, avatar_url, current_latitude, current_longitude, skills")
          .eq("user_id", data.provider_id).single();
        if (prov) setAcceptedProvider(prov as NearbyProvider);
      }
      setVerifying(false); return;
    }
    if (data.status === "no_match" || data.status === "unassigned") setIsExpired(true);
    if (data.status === "cancelled") { toast.info("Esta solicitud fue cancelada"); navigate("/user-landing"); return; }

    const hasValidPayment = data.stripe_visit_payment_intent_id || (data.visit_fee_paid && ["searching", "assigned"].includes(data.status));
    if (!hasValidPayment && data.status !== "unassigned" && data.status !== "no_match") {
      toast.info("Aún no has completado el pago de visita");
      navigate(`/job/${jobId}/payment`); return;
    }

    setJob(data); setVerifying(false);
  }, [jobId, navigate]);

  // ══════════════════════════════════════════════════════════════
  // FETCH NEARBY PROVIDERS
  // ══════════════════════════════════════════════════════════════
  const fetchProviders = useCallback(async () => {
    if (!job) return;
    const { data } = await supabase
      .from("providers")
      .select("user_id, display_name, rating, avatar_url, current_latitude, current_longitude, skills")
      .not("current_latitude", "is", null)
      .not("current_longitude", "is", null);

    if (data && data.length > 0) {
      const category = job.category?.toLowerCase() || "";
      const filtered = data.filter((p: any) => {
        if (!p.skills || p.skills.length === 0) return true;
        return p.skills.some((s: string) => s.toLowerCase().includes(category) || category.includes(s.toLowerCase()));
      });
      setProviders(filtered.length > 0 ? (filtered as NearbyProvider[]) : (data as NearbyProvider[]));
    } else {
      // No real providers with coordinates — use mock positions relative to GDL_CENTER
      // (will be repositioned relative to actual home once geocoding completes)
      const base = homePosRef.current
        ? { lat: homePosRef.current.lat(), lng: homePosRef.current.lng() }
        : GDL_CENTER;
      const mocks: NearbyProvider[] = MOCK_OFFSETS.map((o, i) => ({
        user_id: `mock-${i}`,
        display_name: o.display_name,
        rating: o.rating,
        avatar_url: null,
        current_latitude: base.lat + o.dLat,
        current_longitude: base.lng + o.dLng,
        skills: [],
      }));
      setProviders(mocks);
    }
  }, [job]);

  // ══════════════════════════════════════════════════════════════
  // REALTIME
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    fetchJob();
    if (!jobId) return;
    const channel = supabase.channel(`job-waiting-${jobId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${jobId}` }, async (payload) => {
        const ns = payload.new?.status as string;
        const newJob = payload.new as any;
        if (ns === "accepted" || ns === "confirmed" || ns === "assigned") {
          setJob(newJob); setAccepted(true);
          if (newJob.provider_id) {
            const { data: prov } = await supabase.from("providers")
              .select("user_id, display_name, rating, avatar_url, current_latitude, current_longitude, skills")
              .eq("user_id", newJob.provider_id).single();
            if (prov) setAcceptedProvider(prov as NearbyProvider);
          }
        } else if (ns === "unassigned") {
          setIsExpired(true); setJob(newJob);
        } else if (ns === "cancelled") {
          toast.info("Solicitud cancelada"); navigate("/user-landing");
        } else {
          setJob(newJob);
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [jobId, fetchJob, navigate]);

  // ══════════════════════════════════════════════════════════════
  // BLOCK BACK NAVIGATION TO STRIPE
  // Pressing back from this page would return the user to the Stripe
  // checkout session. Instead, intercept popstate and send them home.
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePop = () => navigate('/user-landing', { replace: true });
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [navigate]);

  // ══════════════════════════════════════════════════════════════
  // COUNTDOWN / EXPIRY
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!job?.assignment_deadline || isExpired || accepted) return;
    const tick = () => {
      const diff = new Date(job.assignment_deadline).getTime() - Date.now();
      if (diff <= 0) {
        setIsExpired(true);
        // notify-no-provider handles the full transition: cancels the Stripe
        // hold, flips status to `no_match`, and emails the client.
        supabase.functions.invoke("notify-no-provider", { body: { jobId: job.id } }).catch(console.error);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [job?.assignment_deadline, isExpired, accepted]);

  // ══════════════════════════════════════════════════════════════
  // FETCH PROVIDERS WHEN JOB LOADS
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (job && !accepted) fetchProviders();
  }, [job, accepted, fetchProviders]);

  // ══════════════════════════════════════════════════════════════
  // INIT MAP
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!job || accepted) return;
    let cancelled = false;

    loadGoogleMaps().then(() => {
      if (cancelled || !mapContainerRef.current || mapRef.current) return;

      const map = new google.maps.Map(mapContainerRef.current, {
        center: GDL_CENTER,
        zoom: 14,
        mapId: 'DEMO_MAP_ID',
        disableDefaultUI: true,
        zoomControl: false,
        gestureHandling: "none",
        clickableIcons: false,
        backgroundColor: "#f0efe8",
      });
      mapRef.current = map;

      // Geocode job location → place home marker
      if (job.location) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: job.location }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const loc = results[0].geometry.location;
            map.setCenter(loc);
            map.setZoom(15);
            homePosRef.current = loc;

            const homeEl = document.createElement("div");
            homeEl.innerHTML = homeMarkerHtml;
            homeMarkerRef.current = new (google.maps.marker as any).AdvancedMarkerElement({
              map,
              position: { lat: loc.lat(), lng: loc.lng() },
              content: homeEl,
              zIndex: 10,
            });

            // Reposition mock providers relative to actual home
            setProviders(prev => {
              if (prev.length > 0 && prev[0].user_id.startsWith('mock-')) {
                return MOCK_OFFSETS.map((o, i) => ({
                  user_id: `mock-${i}`,
                  display_name: o.display_name,
                  rating: o.rating,
                  avatar_url: null,
                  current_latitude: loc.lat() + o.dLat,
                  current_longitude: loc.lng() + o.dLng,
                  skills: [],
                }));
              }
              return prev;
            });
          }
        });
      }

      setMapReady(true);
    }).catch(() => toast.error("Error al cargar el mapa"));

    return () => { cancelled = true; };
  }, [job, accepted]);

  // ══════════════════════════════════════════════════════════════
  // ADD PROVIDER MARKERS
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!mapReady || !mapRef.current || providers.length === 0) return;

    // Clear old markers
    providerMarkersRef.current.forEach(m => { try { m.map = null; } catch (_) {} });
    providerMarkersRef.current = [];

    providers.forEach((p, i) => {
      const el = document.createElement("div");
      el.innerHTML = providerMarkerHtml(i === activeIdx);
      const marker = new (google.maps.marker as any).AdvancedMarkerElement({
        map: mapRef.current!,
        position: { lat: Number(p.current_latitude), lng: Number(p.current_longitude) },
        content: el,
        zIndex: i === activeIdx ? 20 : 5,
      });
      providerMarkersRef.current.push(marker);
    });
  }, [mapReady, providers]); // eslint-disable-line react-hooks/exhaustive-deps

  // ══════════════════════════════════════════════════════════════
  // CYCLE THROUGH PROVIDERS
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!mapReady || providers.length === 0 || accepted || isExpired) return;

    const clearRoute = () => {
      if (activeRouteRef.current) { activeRouteRef.current.setMap(null); activeRouteRef.current = null; }
    };

    const focusProvider = (idx: number) => {
      const prov = providers[idx];
      if (!prov || !mapRef.current) return;

      const provPos = { lat: Number(prov.current_latitude), lng: Number(prov.current_longitude) };

      // Update all marker icons
      providerMarkersRef.current.forEach((m, i) => {
        const el = document.createElement("div");
        el.innerHTML = providerMarkerHtml(i === idx);
        m.content = el;
        m.zIndex = i === idx ? 20 : 5;
      });

      // Fit bounds
      const bounds = new google.maps.LatLngBounds();
      if (homePosRef.current) bounds.extend(homePosRef.current);
      else bounds.extend(GDL_CENTER);
      bounds.extend(provPos);
      mapRef.current.fitBounds(bounds, { top: 40, bottom: 100, left: 40, right: 40 });

      // Draw dashed route
      clearRoute();
      const ds = new google.maps.DirectionsService();
      const dest = homePosRef.current ? { lat: homePosRef.current.lat(), lng: homePosRef.current.lng() } : GDL_CENTER;
      ds.route({ origin: provPos, destination: dest, travelMode: google.maps.TravelMode.DRIVING }, (result, status) => {
        if (status === "OK" && result) {
          const path = result.routes[0].overview_path;
          activeRouteRef.current = new google.maps.Polyline({
            path,
            strokeColor: "#0D9E6A",
            strokeOpacity: 0,
            strokeWeight: 3,
            icons: [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 0.7, scale: 3 }, offset: "0", repeat: "12px" }],
            map: mapRef.current!,
          });
          const leg = result.routes[0]?.legs[0];
          if (leg?.duration) setEtaText(leg.duration.text);
        }
      });

      // Show focus card with brief delay
      setFocusCardVisible(false);
      setTimeout(() => setFocusCardVisible(true), 80);
      setMsgIdx(idx % MESSAGES.length);
    };

    focusProvider(activeIdx);

    cycleTimerRef.current = setInterval(() => {
      setActiveIdx(prev => {
        const next = (prev + 1) % providers.length;
        focusProvider(next);
        return next;
      });
    }, CYCLE_INTERVAL_MS);

    return () => {
      if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);
    };
  }, [mapReady, providers, accepted, isExpired]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stop cycle + redirect on acceptance ──
  useEffect(() => {
    if (accepted) {
      if (cycleTimerRef.current) { clearInterval(cycleTimerRef.current); cycleTimerRef.current = null; }
      const t = setTimeout(() => navigate("/active-jobs"), 2500);
      return () => clearTimeout(t);
    }
  }, [accepted, navigate]);

  // ══════════════════════════════════════════════════════════════
  // ACTIONS
  // ══════════════════════════════════════════════════════════════
  const handleCancel = async () => {
    if (!job) return;
    setCancelling(true);
    // Route through cancel-job so the Stripe visit-fee hold is actually
    // cancelled (the edge function handles PI + status + notifications).
    // Works for no_match too — job.provider_id is null, isLate=false.
    const { data, error: fnErr } = await supabase.functions.invoke("cancel-job", {
      body: { job_id: job.id, cancelled_by: "client" },
    });
    setCancelling(false);
    if (fnErr || data?.error) {
      toast.error(data?.error || fnErr?.message || "Error al cancelar");
      return;
    }
    toast.success("Solicitud cancelada. Tu cargo será reembolsado.");
    navigate("/user-landing");
  };

  const handleRetry = async () => {
    if (!job) return;
    setRetrying(true);
    const newDeadline = new Date(Date.now() + ASSIGNMENT_WINDOW_MINUTES * 60 * 1000).toISOString();
    // Clear hold_expires_at so the auto-complete-jobs cron stops reaping
    // this job's Stripe hold. Re-enter searching with a fresh 20-min window.
    const { error } = await supabase.from("jobs")
      .update({
        status: "searching",
        assignment_deadline: newDeadline,
        hold_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    setRetrying(false);
    if (error) { toast.error("Error al reintentar"); }
    else {
      setIsExpired(false);
      setJob((p: any) => p ? { ...p, status: "searching", assignment_deadline: newDeadline, hold_expires_at: null } : p);
      toast.success("¡Búsqueda reiniciada!");
      fetchProviders();
    }
  };

  const handleSaveNotifyPhone = async () => {
    if (!job || !notifyPhone.trim()) return;
    setSavingPhone(true);
    await supabase.from("jobs").update({
      description: (job.description || "") + `\n[Notificar al: ${notifyPhone.trim()}]`,
    }).eq("id", job.id);
    setSavingPhone(false);
    setNotifyOpen(false);
    toast.success("Te avisaremos cuando haya un técnico disponible");
  };

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  if (verifying) return <GenericPageSkeleton />;

  const jobShortId = job?.id ? job.id.slice(0, 8).toUpperCase() : "—";
  const msg = MESSAGES[msgIdx];

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">

      {/* ── Nav bar ── */}
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-2.5 bg-[#FAFAF8] z-20 flex-shrink-0">
        <button
          onClick={() => navigate("/user-landing")}
          className="w-[34px] h-[34px] rounded-full bg-[#F5F5F2] border border-[#E0E0DA] flex items-center justify-center flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4 text-[#0F0F0E]" />
        </button>
        <span className="text-[15px] font-semibold text-[#0F0F0E]">Buscando técnico</span>
        <div className="ml-auto bg-[#F5F5F2] border border-[#E0E0DA] rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#686860]">
          #{jobShortId}
        </div>
      </div>

      {/* ── Map area (fixed 360px) ── */}
      <div className="relative flex-shrink-0" style={{ height: 360 }}>
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating message bar */}
        {!accepted && !isExpired && (
          <div className="absolute top-3 left-3 right-3 z-[15] pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={msgIdx}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.35 }}
                className="bg-white rounded-[14px] px-3.5 py-2.5 flex items-start gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.14)] border border-black/[0.06]"
              >
                <span
                  className="mt-0.5 w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background: msg.amber ? "#E8A020" : "#0D9E6A",
                    animation: msg.amber ? "none" : "chamby-pulse 1.4s ease-in-out infinite",
                  }}
                />
                <div>
                  <p className="text-[12px] font-semibold text-[#0F0F0E] leading-snug">{msg.text}</p>
                  <p className="text-[11px] text-[#686860] mt-0.5">{msg.sub}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Provider focus card */}
        {!accepted && !isExpired && activeProv && (
          <AnimatePresence>
            {focusCardVisible && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-[88px] left-3 right-3 z-[15] bg-white rounded-2xl px-3.5 py-3 shadow-[0_6px_24px_rgba(0,0,0,0.16)] border border-black/[0.06] flex items-center gap-3 pointer-events-none"
              >
                <div className="w-10 h-10 rounded-full bg-[#E6F7F1] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {activeProv.avatar_url ? (
                    <img src={activeProv.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#0D9E6A" strokeWidth="1.8" strokeLinecap="round">
                      <circle cx="10" cy="6.5" r="3.5" />
                      <path d="M3 18c0-3.9 3.1-7 7-7s7 3.1 7 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-[#0F0F0E] truncate">
                    {activeProv.display_name || "Chambynauta"}
                  </p>
                  <p className="text-[11px] text-[#686860] mt-0.5">
                    {activeProv.rating ? `★ ${Number(activeProv.rating).toFixed(1)} · ` : ""}
                    Técnico verificado
                  </p>
                </div>
                {etaText && (
                  <div className="flex-shrink-0 bg-[#E6F7F1] text-[#0A7A52] rounded-full px-2.5 py-1 text-[12px] font-bold">
                    {etaText}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Searching skeleton when no providers yet */}
        {!accepted && !isExpired && providers.length === 0 && (
          <div className="absolute bottom-[88px] left-3 right-3 z-[15] bg-white rounded-2xl px-3.5 py-3 shadow-[0_6px_24px_rgba(0,0,0,0.16)] border border-black/[0.06] flex items-center gap-3 pointer-events-none">
            <Loader2 className="w-4 h-4 animate-spin text-[#686860]" />
            <p className="text-[13px] text-[#686860]">Buscando técnicos cercanos…</p>
          </div>
        )}

        {/* Accepted overlay */}
        <AnimatePresence>
          {accepted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2.5"
              style={{ background: "rgba(13,158,106,0.92)" }}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ border: "2.5px solid rgba(255,255,255,0.4)" }}
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 14l6.5 6.5L23 7" />
                </svg>
              </motion.div>
              <p className="text-[18px] font-bold text-white">¡Técnico aceptó!</p>
              <p className="text-[13px] text-white/80">
                {acceptedProvider?.display_name || "Un Chambynauta"} está en camino
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none z-10"
          style={{ background: "linear-gradient(to top, #FAFAF8 0%, transparent 100%)" }} />
      </div>

      {/* ── Bottom sheet ── */}
      <div className="flex-1 bg-[#FAFAF8] flex flex-col overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-3.5 flex-shrink-0">
          <div className="w-9 h-1 rounded-full bg-[#C8C8C0]" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
          {/* Status pill */}
          {!isExpired && (
            <div className="inline-flex items-center gap-1.5 bg-[#E6F7F1] rounded-full px-3 py-1.5 mb-2.5">
              <span
                className="w-2 h-2 rounded-full bg-[#0D9E6A]"
                style={{ animation: "chamby-pulse 1.4s ease-in-out infinite" }}
              />
              <span className="text-[12px] font-semibold text-[#0A7A52]">
                {providers.length > 0 ? `${providers.length} técnico${providers.length !== 1 ? "s" : ""} en tu zona` : "Buscando técnicos…"}
              </span>
            </div>
          )}

          <h1 className="text-[20px] font-bold text-[#0F0F0E] mb-1">
            {isExpired ? "No encontramos a nadie" : "Buscando tu técnico"}
          </h1>
          <p className="text-[13px] text-[#686860] leading-[1.55] mb-3.5">
            {isExpired
              ? "No encontramos un proveedor disponible. Tienes 2 horas para intentar de nuevo sin perder tu lugar."
              : "Notificamos a los proveedores más cercanos. Suelen responder en menos de 5 minutos."}
          </p>

          {/* Step rows */}
          <div className="flex flex-col">
            {/* Step 1 — Job created */}
            <div className="flex items-center gap-2.5 py-2.5 border-b border-[#E0E0DA]">
              <div className="w-7 h-7 rounded-full bg-[#0D9E6A] flex items-center justify-center flex-shrink-0">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M2 6.5l3 3 6-6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#0F0F0E]">Solicitud creada</p>
                <p className="text-[11px] text-[#A0A098]">#{jobShortId}</p>
              </div>
              <span className="text-[11px] font-semibold text-[#0D9E6A] flex-shrink-0">Listo</span>
            </div>

            {/* Step 2 — Payment in escrow */}
            <div className="flex items-center gap-2.5 py-2.5 border-b border-[#E0E0DA]">
              <div className="w-7 h-7 rounded-full bg-[#0D9E6A] flex items-center justify-center flex-shrink-0">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M2 6.5l3 3 6-6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#0F0F0E]">Pago en escrow</p>
                <p className="text-[11px] text-[#A0A098]">$406 MXN retenidos</p>
              </div>
              <span className="text-[11px] font-semibold text-[#0D9E6A] flex-shrink-0">Seguro</span>
            </div>

            {/* Step 3 — Notifying (active) / Expired */}
            {!isExpired && (
              <div className="flex items-center gap-2.5 py-2.5 border-b border-[#E0E0DA]">
                <div className="w-7 h-7 rounded-full bg-[#0F0F0E] flex items-center justify-center flex-shrink-0">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="6.5" cy="6.5" r="5" /><path d="M6.5 4v2.5l1.5 1.5" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#0F0F0E]">Notificando técnicos</p>
                  <p className="text-[11px] text-[#A0A098]">
                    {providers.length > 0 ? `${providers.length} proveedores cerca` : "Buscando disponibles…"}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[#E8A020] flex-shrink-0">En curso</span>
              </div>
            )}

            {/* Step 4 — Provider on the way (pending) */}
            {!isExpired && (
              <div className="flex items-center gap-2.5 py-2.5 opacity-40">
                <div className="w-7 h-7 rounded-full bg-[#E0E0DA] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#0F0F0E]">Técnico en camino</p>
                  <p className="text-[11px] text-[#A0A098]">Recibirás una notificación</p>
                </div>
                <span className="text-[11px] font-semibold text-[#A0A098] flex-shrink-0">Pendiente</span>
              </div>
            )}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="px-4 pt-2.5 pb-8 flex flex-col gap-2 flex-shrink-0 bg-[#FAFAF8]">
          {isExpired ? (
            <>
              <button
                onClick={handleRetry}
                disabled={retrying || cancelling}
                className="w-full h-[50px] rounded-full bg-[#0F0F0E] text-white text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity hover:opacity-85"
              >
                <RotateCcw className="w-4 h-4" />
                {retrying ? "Reintentando…" : "Intentar de nuevo"}
              </button>
              <button
                onClick={handleCancel}
                disabled={retrying || cancelling}
                className="w-full h-[50px] rounded-full border-[1.5px] border-[#C8C8C0] text-[#0F0F0E] text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors hover:border-[#0F0F0E] disabled:opacity-60"
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {cancelling ? "Cancelando…" : "Cancelar y reembolsar"}
              </button>
              <button
                onClick={() => window.open("https://wa.me/523325520551", "_blank")}
                className="w-full h-[46px] rounded-full text-[13px] font-medium text-[#686860] hover:text-[#0F0F0E] transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Contactar por WhatsApp
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setNotifyOpen(true)}
                className="w-full h-[50px] rounded-full bg-[#0F0F0E] text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-85"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M7.5 1C5.6 1 4 2.5 4 4.4c0 2.7 3.5 8.1 3.5 8.1S11 7.1 11 4.4C11 2.5 9.4 1 7.5 1z" />
                  <circle cx="7.5" cy="4.4" r="1.4" fill="white" stroke="none" />
                </svg>
                Avísame cuando haya un técnico
              </button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full h-[50px] rounded-full border-[1.5px] border-[#C8C8C0] text-[#686860] text-[14px] font-semibold transition-colors hover:border-[#0F0F0E] hover:text-[#0F0F0E]">
                    Cancelar solicitud
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cancelar solicitud?</AlertDialogTitle>
                    <AlertDialogDescription>Si cancelas, se aplicará la política de reembolso.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Volver</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {cancelling ? "Cancelando..." : "Sí, cancelar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {/* ── Notify modal (bottom sheet style) ── */}
      <AnimatePresence>
        {notifyOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#0F0F0E]/50"
              onClick={() => setNotifyOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#FAFAF8] rounded-t-[28px] px-5 pb-10"
            >
              <div className="w-9 h-1 rounded-full bg-[#C8C8C0] mx-auto mt-3 mb-4" />
              <h2 className="text-[18px] font-bold text-[#0F0F0E] mb-1.5">¿A dónde te avisamos?</h2>
              <p className="text-[13px] text-[#686860] leading-[1.6] mb-4">
                Te mandamos mensaje en cuanto un técnico acepte. Normalmente tarda menos de 10 minutos.
              </p>
              <Input
                value={notifyPhone}
                onChange={(e) => setNotifyPhone(e.target.value)}
                placeholder="WhatsApp o número de teléfono"
                type="tel"
                inputMode="tel"
                className="h-12 text-base border-[#C8C8C0] rounded-xl mb-3 focus:border-[#0F0F0E]"
                style={{ fontSize: "16px" }}
                maxLength={20}
              />
              <button
                onClick={handleSaveNotifyPhone}
                disabled={!notifyPhone.trim() || savingPhone}
                className="w-full h-[50px] rounded-full bg-[#0F0F0E] text-white text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50 mb-2.5"
              >
                {savingPhone ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {savingPhone ? "Guardando…" : "Confirmar — avísame"}
              </button>
              <button
                onClick={() => setNotifyOpen(false)}
                className="w-full text-center text-[13px] text-[#A0A098] py-1.5"
              >
                Ahora no
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Pulse animation keyframes ── */}
      <style>{`
        @keyframes chamby-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.6); }
        }
      `}</style>
    </div>
  );
};

export default EsperandoProveedor;
