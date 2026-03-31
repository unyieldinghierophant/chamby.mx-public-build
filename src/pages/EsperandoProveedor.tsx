import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GenericPageSkeleton } from "@/components/skeletons";
import { MessageCircle, RotateCcw, Home, X, Phone, Loader2, Star, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

const ASSIGNMENT_WINDOW_HOURS = 1;
const CYCLE_INTERVAL_MS = 3800;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GDL_CENTER = { lat: 20.6597, lng: -103.3496 };

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
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,directions`;
    s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Google Maps failed"));
    document.head.appendChild(s);
  });
  return gMapsPromise;
}

// ─── Rotating messages ───────────────────────────────────────
const buildMessages = (visitFee?: number | null) => [
  "Notificando técnicos cercanos…",
  "Verificando disponibilidad en tu zona",
  "Tu pago está seguro · $" + (visitFee ?? 429) + " MXN en escrow",
  "Tiempo promedio de respuesta: ~4 min",
  "Conectando con especialistas verificados…",
];

// ─── Custom map styles ───────────────────────────────────────
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#f5f1eb" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "water", stylers: [{ color: "#c9e8f5" }] },
  { featureType: "landscape", stylers: [{ color: "#f8f6f2" }] },
];

// ─── SVG marker builders ─────────────────────────────────────
const homeMarkerSvg = `
<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
  <circle cx="18" cy="18" r="16" fill="#0f0f0f" stroke="white" stroke-width="2"/>
  <path d="M18 10l-7 6v8h5v-5h4v5h5v-8l-7-6z" fill="white"/>
</svg>`;

const providerMarkerSvg = (active: boolean) => `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="18" fill="${active ? '#16a34a' : '#6b7280'}" stroke="white" stroke-width="2.5"/>
  <circle cx="20" cy="14" r="5" fill="white"/>
  <path d="M12 28c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="white" opacity="0.9"/>
</svg>`;

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

  // ── Map state ──
  const [providers, setProviders] = useState<NearbyProvider[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [etaText, setEtaText] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // ── Bottom sheet ──
  const [notifySheetOpen, setNotifySheetOpen] = useState(false);
  const [notifyPhone, setNotifyPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  // ── Refs ──
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const homeMarkerRef = useRef<google.maps.Marker | null>(null);
  const providerMarkersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const cycleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const messages = useMemo(() => buildMessages(job?.visit_fee_amount), [job?.visit_fee_amount]);

  // ── Parse job location coords ──
  const jobCoords = useMemo(() => {
    if (!job?.location) return GDL_CENTER;
    // Try to extract coords from location string (reverse geocoded address)
    // We store lat/lng in the job record or we use the address center
    // For now we'll geocode when map inits
    return GDL_CENTER;
  }, [job?.location]);

  // ══════════════════════════════════════════════════════════════
  // FETCH JOB
  // ══════════════════════════════════════════════════════════════
  const fetchJob = useCallback(async () => {
    if (!jobId) { setVerifying(false); return; }
    const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).single();

    if (error || !data) { toast.error("No se encontró la solicitud"); navigate("/user-landing"); return; }
    if (data.status === "accepted" || data.status === "confirmed" || data.status === "assigned") {
      // Provider already assigned — show accepted overlay
      setJob(data);
      setAccepted(true);
      // Fetch provider info
      if (data.provider_id) {
        const { data: prov } = await supabase.from("providers").select("user_id, display_name, rating, avatar_url, current_latitude, current_longitude, skills").eq("user_id", data.provider_id).single();
        if (prov) setAcceptedProvider(prov as NearbyProvider);
      }
      setVerifying(false);
      return;
    }
    if (data.status === "unassigned") setIsExpired(true);
    if (data.status === "cancelled") { toast.info("Esta solicitud fue cancelada"); navigate("/user-landing"); return; }

    const hasValidPayment = data.stripe_visit_payment_intent_id || (data.visit_fee_paid && ["searching", "assigned"].includes(data.status));
    if (!hasValidPayment && data.status !== "unassigned") { toast.info("Aún no has completado el pago de visita"); navigate(`/job/${jobId}/payment`); return; }

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

    if (data) {
      // Filter by category match in skills (loose match)
      const category = job.category?.toLowerCase() || "";
      const filtered = data.filter((p: any) => {
        if (!p.skills || p.skills.length === 0) return true; // show providers with any skills
        return p.skills.some((s: string) => s.toLowerCase().includes(category) || category.includes(s.toLowerCase()));
      });
      setProviders(filtered.length > 0 ? (filtered as NearbyProvider[]) : (data as NearbyProvider[]));
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
          setJob(newJob);
          setAccepted(true);
          if (newJob.provider_id) {
            const { data: prov } = await supabase.from("providers").select("user_id, display_name, rating, avatar_url, current_latitude, current_longitude, skills").eq("user_id", newJob.provider_id).single();
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
  // COUNTDOWN
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!job?.assignment_deadline || isExpired || accepted) return;
    const tick = () => {
      const diff = new Date(job.assignment_deadline).getTime() - Date.now();
      if (diff <= 0) {
        setIsExpired(true);
        supabase.from("jobs").update({ status: "unassigned" }).eq("id", job.id).then();
        supabase.functions.invoke("notify-no-provider", { body: { jobId: job.id } }).catch(console.error);
      }
    };
    tick(); const interval = setInterval(tick, 1000);
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
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: false,
        gestureHandling: "none",
        styles: MAP_STYLES,
        backgroundColor: "#f8f6f2",
      });

      mapRef.current = map;

      // Geocode the job location to get coordinates
      if (job.location) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: job.location }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const loc = results[0].geometry.location;
            map.setCenter(loc);
            map.setZoom(14);

            // Home marker
            homeMarkerRef.current = new google.maps.Marker({
              position: loc,
              map,
              icon: {
                url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(homeMarkerSvg),
                scaledSize: new google.maps.Size(36, 36),
                anchor: new google.maps.Point(18, 18),
              },
              zIndex: 10,
            });
          }
        });
      }

      // Directions renderer
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#16a34a",
          strokeWeight: 4,
          strokeOpacity: 0.7,
          icons: [{
            icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 },
            offset: "0",
            repeat: "16px",
          }],
        },
      });
      directionsRendererRef.current.setMap(map);

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
    providerMarkersRef.current.forEach(m => m.setMap(null));
    providerMarkersRef.current = [];

    providers.forEach((p, i) => {
      const marker = new google.maps.Marker({
        position: { lat: Number(p.current_latitude), lng: Number(p.current_longitude) },
        map: mapRef.current!,
        icon: {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(providerMarkerSvg(i === activeIdx)),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20),
        },
        zIndex: i === activeIdx ? 5 : 1,
      });
      providerMarkersRef.current.push(marker);
    });
  }, [mapReady, providers, activeIdx]);

  // ══════════════════════════════════════════════════════════════
  // CYCLE THROUGH PROVIDERS
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!mapReady || providers.length === 0 || accepted || isExpired) return;

    const focusProvider = (idx: number) => {
      const prov = providers[idx];
      if (!prov || !mapRef.current || !homeMarkerRef.current) return;

      const provPos = { lat: Number(prov.current_latitude), lng: Number(prov.current_longitude) };
      const homePos = homeMarkerRef.current.getPosition();
      if (!homePos) return;

      // Update marker icons
      providerMarkersRef.current.forEach((m, i) => {
        m.setIcon({
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(providerMarkerSvg(i === idx)),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20),
        });
        m.setZIndex(i === idx ? 5 : 1);
      });

      // Fit bounds to show both
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(homePos);
      bounds.extend(provPos);
      mapRef.current.fitBounds(bounds, { top: 80, bottom: 200, left: 40, right: 40 });

      // Draw directions
      const directionsService = new google.maps.DirectionsService();
      directionsService.route({
        origin: provPos,
        destination: { lat: homePos.lat(), lng: homePos.lng() },
        travelMode: google.maps.TravelMode.DRIVING,
      }, (result, status) => {
        if (status === "OK" && result && directionsRendererRef.current) {
          directionsRendererRef.current.setDirections(result);
          const leg = result.routes[0]?.legs[0];
          if (leg?.duration) {
            setEtaText(leg.duration.text);
          }
        }
      });

      setMsgIdx(idx % messages.length);
    };

    // Immediate focus on first provider
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
  }, [mapReady, providers, accepted, isExpired, messages]);

  // ── Stop cycle on acceptance ──
  useEffect(() => {
    if (accepted && cycleTimerRef.current) {
      clearInterval(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }
    if (accepted) {
      // Navigate after 2.5s
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
    const { error } = await supabase.from("jobs").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", job.id);
    setCancelling(false);
    if (error) toast.error("Error al cancelar");
    else { toast.success("Solicitud cancelada"); navigate("/user-landing"); }
  };

  const handleRetry = async () => {
    if (!job) return;
    setRetrying(true);
    const newDeadline = new Date(Date.now() + ASSIGNMENT_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("jobs").update({
      status: "searching", assignment_deadline: newDeadline, updated_at: new Date().toISOString(),
    }).eq("id", job.id);
    setRetrying(false);
    if (error) { toast.error("Error al reintentar"); }
    else {
      setIsExpired(false);
      setJob((p: any) => p ? { ...p, status: "searching", assignment_deadline: newDeadline } : p);
      toast.success("¡Búsqueda reiniciada!");
      fetchProviders();
    }
  };

  const handleSaveNotifyPhone = async () => {
    if (!job || !notifyPhone.trim()) return;
    setSavingPhone(true);
    // Save phone as description note (lightweight — no schema change)
    await supabase.from("jobs").update({
      description: (job.description || "") + `\n[Notificar al: ${notifyPhone.trim()}]`,
    }).eq("id", job.id);
    setSavingPhone(false);
    setNotifySheetOpen(false);
    toast.success("Te avisaremos cuando haya un técnico disponible");
  };

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  if (verifying) return <GenericPageSkeleton />;

  const activeProv = providers[activeIdx];

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* ── Top nav ── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 pt-3 pb-2">
        <button onClick={() => navigate("/user-landing")} className="w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center shadow-sm">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <span className="text-sm font-semibold text-foreground bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border shadow-sm">
          Buscando técnico
        </span>
      </div>

      {/* ── Rotating message bar ── */}
      {!accepted && !isExpired && (
        <div className="absolute top-14 left-4 right-4 z-30">
          <AnimatePresence mode="wait">
            <motion.div
              key={msgIdx}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
              className="bg-foreground/90 backdrop-blur-sm text-background text-[13px] font-medium text-center py-2.5 px-4 rounded-xl shadow-lg"
            >
              {messages[msgIdx]}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ── Map ── */}
      <div ref={mapContainerRef} className="flex-1 w-full min-h-0" />

      {/* ── Accepted overlay ── */}
      <AnimatePresence>
        {accepted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-40 bg-[hsl(145,60%,38%)]/90 backdrop-blur-sm flex flex-col items-center justify-center text-white px-6"
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M8 20l8 8L32 12" /></svg>
              </div>
            </motion.div>
            <h2 className="text-2xl font-bold mb-1">¡Técnico aceptó!</h2>
            <p className="text-lg opacity-90">{acceptedProvider?.display_name || "Un Chambynauta"} viene en camino</p>
            <p className="text-sm opacity-70 mt-2">Redirigiendo…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom card — Active provider info ── */}
      {!accepted && !isExpired && (
        <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-5 pt-2 pointer-events-none">
          <div className="bg-background border border-border rounded-2xl shadow-xl p-4 space-y-3 pointer-events-auto">
            {/* Provider preview */}
            {activeProv ? (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {activeProv.avatar_url ? (
                    <img src={activeProv.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><circle cx="12" cy="8" r="4" /><path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" /></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {activeProv.display_name || "Chambynauta"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {activeProv.rating ? (
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {Number(activeProv.rating).toFixed(1)}
                      </span>
                    ) : null}
                    {etaText && (
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        ETA {etaText}
                      </span>
                    )}
                  </div>
                </div>
                {/* Provider count badge */}
                <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {activeIdx + 1}/{providers.length}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Buscando técnicos cercanos…</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setNotifySheetOpen(true)}
                className="flex-1 h-11 rounded-xl bg-foreground text-background text-[13px] font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
              >
                <Phone className="w-3.5 h-3.5" />
                Avísame cuando haya uno
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="h-11 px-4 rounded-xl border border-border text-[13px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                    Cancelar
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cancelar solicitud?</AlertDialogTitle>
                    <AlertDialogDescription>Si cancelas, se aplicará la política de reembolso.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Volver</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel} disabled={cancelling} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {cancelling ? "Cancelando..." : "Sí, cancelar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      )}

      {/* ── "No provider" modal ── */}
      <Dialog open={isExpired} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md rounded-2xl [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="text-center items-center pt-2">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-3 mx-auto">
              <X className="w-7 h-7 text-destructive" />
            </div>
            <DialogTitle className="text-lg font-semibold text-foreground">
              No encontramos a nadie disponible
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed mt-1">
              Ningún Chambynauta tomó tu trabajo en este momento. Puedes intentarlo de nuevo o contactarnos directamente.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-4">
            <Button onClick={handleRetry} disabled={retrying} className="w-full rounded-full h-12 gap-2">
              <RotateCcw className="w-4 h-4" />
              {retrying ? "Reintentando..." : "Intentar de nuevo"}
            </Button>
            <Button variant="outline" onClick={() => window.open("https://wa.me/523325520551", "_blank")} className="w-full rounded-full h-12 gap-2 border-[hsl(145,70%,40%)] text-[hsl(145,70%,40%)] hover:bg-[hsl(145,70%,40%)]/10">
              <MessageCircle className="w-4 h-4" />
              Contactar por WhatsApp
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")} className="w-full rounded-full h-12 gap-2 text-muted-foreground">
              <Home className="w-4 h-4" />
              Volver al inicio
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Notify bottom sheet ── */}
      <Sheet open={notifySheetOpen} onOpenChange={setNotifySheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-5 pb-8">
          <SheetHeader className="text-left mb-4">
            <SheetTitle className="text-lg">Avísame cuando haya un técnico</SheetTitle>
            <p className="text-sm text-muted-foreground">Te enviaremos un mensaje cuando un Chambynauta esté disponible para tu solicitud.</p>
          </SheetHeader>
          <div className="space-y-3">
            <Input
              value={notifyPhone}
              onChange={(e) => setNotifyPhone(e.target.value)}
              placeholder="Tu número de WhatsApp o teléfono"
              className="h-12 text-base"
              style={{ fontSize: "16px" }}
              maxLength={20}
            />
            <Button onClick={handleSaveNotifyPhone} disabled={!notifyPhone.trim() || savingPhone} className="w-full h-12 rounded-xl gap-2">
              {savingPhone ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
              {savingPhone ? "Guardando..." : "Guardar y avisarme"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default EsperandoProveedor;
