import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COOKIE_KEY = "chamby_cookie_consent";

const setCookie = (value: string) => {
  const maxAge = 365 * 24 * 60 * 60;
  document.cookie = `${COOKIE_KEY}=${value}; max-age=${maxAge}; path=/; SameSite=Lax`;
};

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_KEY)) {
      setVisible(true);
    }
  }, []);

  const handle = (choice: "accepted" | "rejected") => {
    localStorage.setItem(COOKIE_KEY, choice);
    setCookie(choice);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-x-0 bottom-0 z-[60] flex justify-center pointer-events-none"
        >
          <div className="pointer-events-auto w-full max-w-lg rounded-t-2xl bg-card border border-border shadow-xl px-5 pt-5 pb-6 mx-0 sm:mx-4 sm:mb-4 sm:rounded-2xl">
            <h3 className="text-lg font-bold text-foreground mb-1">Usamos cookies</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Utilizamos cookies y tecnologías similares para mejorar tu experiencia, analizar el tráfico y personalizar el contenido. Puedes aceptar todas las cookies o rechazarlas.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handle("rejected")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Configuración
              </button>
              <div className="flex-1" />
              <button
                onClick={() => handle("rejected")}
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Rechazar
              </button>
              <button
                onClick={() => handle("accepted")}
                className="rounded-full bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Aceptar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
