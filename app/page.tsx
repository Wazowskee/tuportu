'use client';
// @ts-nocheck

import React, { useState, useEffect, useRef, useCallback } from "react";

const GOOGLE_API_KEY = "AIzaSyCtqwdf34gJt0WnKtVtXurDAqh2E0UgmJY"; // ← sostituisci con la tua key

const items = [
  { emoji: "🕐", size: 64, x: 55, y: 8, delay: 0 },
  { emoji: "⚽", size: 60, x: 68, y: 12, delay: 0.15 },
  { emoji: "🪴", size: 52, x: 78, y: 10, delay: 0.3 },
  { emoji: "🧸", size: 66, x: 61, y: 22, delay: 0.1 },
  { emoji: "🖼️", size: 56, x: 70, y: 25, delay: 0.25 },
  { emoji: "⚙️", size: 60, x: 80, y: 23, delay: 0.4 },
  { emoji: "🚲", size: 52, x: 50, y: 28, delay: 0.2 },
  { emoji: "📦", size: 58, x: 48, y: 38, delay: 0.35 },
  { emoji: "📺", size: 54, x: 58, y: 40, delay: 0.05 },
  { emoji: "🛏️", size: 60, x: 67, y: 38, delay: 0.45 },
  { emoji: "🏺", size: 52, x: 73, y: 33, delay: 0.2 },
  { emoji: "🪑", size: 56, x: 49, y: 49, delay: 0.3 },
  { emoji: "🗄️", size: 58, x: 68, y: 52, delay: 0.1 },
  { emoji: "🖥️", size: 62, x: 77, y: 50, delay: 0.5 },
  { emoji: "🛍️", size: 50, x: 59, y: 55, delay: 0.4 },
];

function useGoogleAutocomplete(inputRef: React.RefObject<HTMLInputElement | null>, onSelect: (val: string) => void, sessionKey: number) {
  useEffect(() => {
    if (!inputRef.current) return;
    const interval = setInterval(() => {
      if (typeof window !== "undefined" && (window as any).google?.maps?.places) {
        clearInterval(interval);
        const autocomplete = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
          types: ["address"],
          componentRestrictions: { country: "it" },
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) onSelect(place.formatted_address);
        });
      }
    }, 100);
    return () => clearInterval(interval);
  }, [sessionKey]);
}

function calcDistance(origin: string, destination: string) {
  return new Promise<{distance: string, duration: string} | null>((resolve) => {
    const interval = setInterval(() => {
      if (typeof window !== "undefined" && (window as any).google?.maps) {
        clearInterval(interval);
        const service = new (window as any).google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
          {
            origins: [origin],
            destinations: [destination],
            travelMode: (window as any).google.maps.TravelMode.DRIVING,
            unitSystem: (window as any).google.maps.UnitSystem.METRIC,
          },
          (response: any, status: string) => {
            if (status === "OK") {
              const element = response.rows[0].elements[0];
              if (element.status === "OK") {
                resolve({ distance: element.distance.text, duration: element.duration.text });
              } else resolve(null);
            } else resolve(null);
          }
        );
      }
    }, 100);
  });
}

export default function TuportuLanding() {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [mounted, setMounted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [distanceInfo, setDistanceInfo] = useState<{distance: string, duration: string} | null>(null);
  const [loadingDistance, setLoadingDistance] = useState(false);
  const [sendingForm, setSendingForm] = useState(false);
  const [sendError, setSendError] = useState(false);

  const [form, setForm] = useState<Record<string, string>>({ nome: "", cognome: "", email: "", telefono: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});
  const [sessionKey, setSessionKey] = useState(0);

  const pickupRef = useRef(null);
  const dropoffRef = useRef(null);

  const canSubmit = pickup.trim().length > 3 && dropoff.trim().length > 3;

  useEffect(() => {
    if (!document.getElementById("google-maps-script")) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&language=it`;
      script.async = true;
      document.head.appendChild(script);
    }
    setTimeout(() => setMounted(true), 50);
  }, []);

  useGoogleAutocomplete(pickupRef, useCallback((addr) => setPickup(addr), []), sessionKey);
  useGoogleAutocomplete(dropoffRef, useCallback((addr) => setDropoff(addr), []), sessionKey);

  const handleVediPrezzi = async () => {
    if (!canSubmit) return;
    setSubmitted(true);
    setLoadingDistance(true);
    const result = await calcDistance(pickup, dropoff);
    setDistanceInfo(result);
    setLoadingDistance(false);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.nome.trim()) errors.nome = "Campo obbligatorio";
    if (!form.cognome.trim()) errors.cognome = "Campo obbligatorio";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errors.email = "Email non valida";
    if (!form.telefono.trim() || !/^\+?[0-9\s]{8,15}$/.test(form.telefono)) errors.telefono = "Numero non valido";
    return errors;
  };

  const handleFormSubmit = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSendingForm(true);
    setSendError(false);

    const payload = {
      nome: form.nome,
      cognome: form.cognome,
      email: form.email,
      telefono: form.telefono,
      partenza: pickup,
      destinazione: dropoff,
      distanza: distanceInfo?.distance ?? "N/D",
      tempo: distanceInfo?.duration ?? "N/D",
    };

    try {
      await fetch("https://script.google.com/macros/s/AKfycbzWCGoqDF98I8CjWpGbo-JHipYO4jMUd3tSJyzIP_Xts8USHUl4XZ3f6icx1p8btaye/exec", {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setFormSent(true);
    } catch (err) {
      setSendError(true);
    } finally {
      setSendingForm(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormSent(false);
    setDistanceInfo(null);
    setPickup("");
    setDropoff("");
    setForm({ nome: "", cognome: "", email: "", telefono: "" });
    setFormErrors({});
    setSendError(false);
    setSessionKey(k => k + 1); // forza remount degli input → reinizializza autocomplete
  };

  return (
    <div style={styles.page as React.CSSProperties}>
      {/* Navbar */}
      <nav style={styles.nav as React.CSSProperties} className="tuportu-nav">
        <div style={styles.navLeft as React.CSSProperties}>
          <span style={styles.logo as React.CSSProperties}>Tuportu</span>
          <span style={styles.tagline as React.CSSProperties} className="tuportu-tagline">Traslochi on-demand</span>
        </div>
        <div style={styles.navRight as React.CSSProperties}>
          <button style={styles.bookBtn as React.CSSProperties}>Chiamaci</button>
        </div>
      </nav>

      {submitted ? (
        <div style={styles.thankYouPage as React.CSSProperties}>
          {formSent ? (
            /* ── Conferma finale ── */
            <div style={styles.thankYouCard as React.CSSProperties} className="tuportu-thank-card">
              <div style={styles.checkIcon as React.CSSProperties}>✓</div>
              <h2 style={styles.thankYouTitle as React.CSSProperties}>Grazie per la tua richiesta!</h2>
              <p style={styles.thankYouDesc as React.CSSProperties}>Ti contatteremo a breve per fornirti il preventivo.</p>
              <button style={styles.backBtn as React.CSSProperties} onClick={handleReset}>← Nuova richiesta</button>
            </div>
          ) : (
            /* ── Card distanza + form ── */
            <div style={styles.bigCard as React.CSSProperties} className="tuportu-big-card">
              {/* Riepilogo percorso */}
              <div style={styles.routeHeader as React.CSSProperties}>
                <div style={styles.routeRow as React.CSSProperties}>
                  <span style={styles.routeIconUp as React.CSSProperties}>↑</span>
                  <span style={styles.routeText as React.CSSProperties}>{pickup}</span>
                </div>
                <div style={styles.routeDotted as React.CSSProperties} />
                <div style={styles.routeRow as React.CSSProperties}>
                  <span style={styles.routeIconDown as React.CSSProperties}>↓</span>
                  <span style={styles.routeText as React.CSSProperties}>{dropoff}</span>
                </div>
              </div>

              {/* Distanza */}
              <div style={styles.distanceBox as React.CSSProperties}>
                {loadingDistance ? (
                  <span style={styles.distanceLoading as React.CSSProperties}>Calcolo distanza…</span>
                ) : distanceInfo ? (
                  <>
                    <div style={styles.distanceStat as React.CSSProperties}>
                      <span style={styles.distanceValue as React.CSSProperties}>{distanceInfo.distance}</span>
                      <span style={styles.distanceLabel as React.CSSProperties}>distanza</span>
                    </div>
                    <div style={styles.distanceDivider as React.CSSProperties} />
                    <div style={styles.distanceStat as React.CSSProperties}>
                      <span style={styles.distanceValue as React.CSSProperties}>{distanceInfo.duration}</span>
                      <span style={styles.distanceLabel as React.CSSProperties}>tempo stimato</span>
                    </div>
                  </>
                ) : (
                  <span style={styles.distanceLoading as React.CSSProperties}>Impossibile calcolare la distanza</span>
                )}
              </div>

              <div style={styles.formDivider as React.CSSProperties} />

              {/* Form */}
              <p style={styles.formTitle as React.CSSProperties}>Lasciaci i tuoi contatti</p>
              <div style={styles.formGrid as React.CSSProperties} className="tuportu-form-grid">
                {[
                  { key: "nome", label: "Nome", type: "text", placeholder: "Mario" },
                  { key: "cognome", label: "Cognome", type: "text", placeholder: "Rossi" },
                  { key: "email", label: "Email", type: "email", placeholder: "mario@email.com" },
                  { key: "telefono", label: "Telefono", type: "tel", placeholder: "+39 333 000 0000" },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key} style={styles.fieldGroup as React.CSSProperties}>
                    <label style={styles.fieldLabel as React.CSSProperties}>{label}</label>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={e => {
                        setForm(f => ({ ...f, [key]: e.target.value }));
                        setFormErrors(err => ({ ...err, [key]: undefined }));
                      }}
                      style={{
                        ...styles.fieldInput,
                        borderColor: formErrors[key] ? "#e04040" : "#e0e0e0",
                      }}
                    />
                    {formErrors[key] && <span style={styles.fieldError as React.CSSProperties}>{formErrors[key]}</span>}
                  </div>
                ))}
              </div>

              {sendError && (
                <p style={styles.sendErrorMsg as React.CSSProperties}>
                  ⚠️ Errore durante l'invio. Riprova o contattaci direttamente.
                </p>
              )}

              <div style={styles.formActions as React.CSSProperties} className="tuportu-form-actions">
                <button style={styles.backBtnSmall as React.CSSProperties} onClick={handleReset}>← Indietro</button>
                <button
                  style={{
                    ...styles.submitBtn,
                    opacity: sendingForm ? 0.7 : 1,
                    cursor: sendingForm ? "wait" : "pointer",
                  }}
                  disabled={sendingForm}
                  onClick={handleFormSubmit}
                >
                  {sendingForm ? "Invio in corso…" : "Invia richiesta"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Hero */
        <section style={styles.hero as React.CSSProperties} className="tuportu-hero">
          <div style={styles.itemsContainer as React.CSSProperties} className="tuportu-items-container">
            {items.map((item, i) => (
              <div
                key={i}
                style={{
                  ...styles.itemBubble,
                  width: item.size,
                  height: item.size,
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(20px)",
                  transition: `opacity 0.6s ease ${item.delay}s, transform 0.6s ease ${item.delay}s`,
                  animation: `float${i % 3} ${3 + (i % 2)}s ease-in-out ${item.delay}s infinite`,
                  fontSize: item.size * 0.45,
                }}
              >
                {item.emoji}
              </div>
            ))}
          </div>

          <div style={styles.heroContent as React.CSSProperties} className="tuportu-hero-content">
            <h1 style={{
              ...styles.headline,
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(30px)",
              transition: "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s",
            }}>
              Trasporta <span style={styles.highlight as React.CSSProperties}>di tutto</span>
            </h1>
            <h2 style={{
              ...styles.subHeadline,
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(30px)",
              transition: "opacity 0.7s ease 0.35s, transform 0.7s ease 0.35s",
            }}>
              con un semplice click
            </h2>
            <p style={{
              ...styles.desc,
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.7s ease 0.5s",
            }}>
              In base alle tue esigenze, quando, dove e come vuoi
            </p>

            <div className="tuportu-address-bar" style={{
              ...styles.addressBar,
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.7s ease 0.6s, transform 0.7s ease 0.6s",
            }}>
              <div style={{...styles.inputGroup, position:"relative", flex:1}} className="tuportu-input-group">
                <span style={styles.inputIcon as React.CSSProperties}>↑</span>
                <input
                  key={`pickup-${sessionKey}`}
                  ref={pickupRef}
                  style={styles.input as React.CSSProperties}
                  placeholder="Indirizzo di partenza"
                  value={pickup}
                  onChange={e => setPickup(e.target.value)}
                />
                </div>
              <div style={styles.divider as React.CSSProperties} className="tuportu-bar-divider" />
              <div style={{...styles.inputGroup, position:"relative", flex:1}} className="tuportu-input-group">
                <span style={styles.inputIcon as React.CSSProperties}>↓</span>
                <input
                  key={`dropoff-${sessionKey}`}
                  ref={dropoffRef}
                  style={styles.input as React.CSSProperties}
                  placeholder="Indirizzo di destinazione"
                  value={dropoff}
                  onChange={e => setDropoff(e.target.value)}
                />
                </div>
              <button
                className="tuportu-see-prices"
                style={{
                  ...styles.seePricesBtn,
                  background: canSubmit ? "#5b4fcf" : "#c8c8d0",
                  cursor: canSubmit ? "pointer" : "not-allowed",
                }}
                disabled={!canSubmit}
                onClick={handleVediPrezzi}
              >
                Vedi prezzi
              </button>
            </div>
          </div>
        </section>
      )}

        {/* ── SEZIONE 1: Consegne e trasporti ── */}
        <section style={secStyles.section as React.CSSProperties} className="tuportu-section">
          <h2 style={secStyles.sectionTitle as React.CSSProperties}>Consegne e trasporti su richiesta</h2>
          <div style={secStyles.twoCards as React.CSSProperties} className="tuportu-two-cards">
            {/* Card tracciamento */}
            <div style={secStyles.cardPurple as React.CSSProperties}>
              <p style={secStyles.cardLabel as React.CSSProperties}>Tracciamenti in tempo reale</p>
              <div style={secStyles.mapContainer as React.CSSProperties} className="tuportu-map-container">
                <img
                  src="https://i.postimg.cc/7YTGHNSF/SVG.jpg"
                  alt="mappa città"
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16, display: "block", position: "absolute", top: 0, left: 0 }}
                />
              </div>
            </div>
            {/* Card scheduling */}
            <div style={secStyles.cardYellow as React.CSSProperties}>
              <p style={secStyles.cardLabelDark as React.CSSProperties}>Quando vuoi in base alle esigenze</p>
              <div style={secStyles.scheduleBox as React.CSSProperties}>
                <p style={secStyles.scheduleSubLabel as React.CSSProperties}>Seleziona il giorno</p>
                <div style={secStyles.daysRow as React.CSSProperties}>
                  {["12","13","14","15"].map((d,i) => (
                    <div key={d} style={i===0 ? secStyles.dayActive : secStyles.dayInactive}>{d}</div>
                  ))}
                </div>
                <p style={{...secStyles.scheduleSubLabel, marginTop:16}}>Seleziona l&apos;orario</p>
                <div style={secStyles.slotsGrid as React.CSSProperties}>
                  {["Quanto prima","14.00 - 15.00","15.00 - 16.00","16.00 - 17.00"].map((s,i) => (
                    <div key={s} style={i===0 ? secStyles.slotActive : secStyles.slotInactive}>{s}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SEZIONE 2: Servizi ── */}
        <section style={secStyles.section as React.CSSProperties} className="tuportu-section">
          <h2 style={secStyles.sectionTitle as React.CSSProperties}>Un camion per ogni occasione</h2>
          <div style={secStyles.servicesGrid as React.CSSProperties} className="tuportu-services-grid">
            {[
              {icon:"🏠", label:"Traslochi residenziali"},
              {icon:"🎓", label:"Traslochi studenti"},
              {icon:"🏢", label:"Consegna scorte di magazzino"},
              {icon:"🏬", label:"Traslochi commerciali"},
              {icon:"🛋️", label:"Consegna mobili"},
              {icon:"🫙", label:"Consegna elettrodomestici"},
              {icon:"♻️", label:"Consegna articoli usati"},
              {icon:"📦", label:"Consegna articoli grandi"},
              {icon:"🗑️", label:"Rimozione spazzatura"},
              {icon:"💝", label:"Consegna donazioni"},
              {icon:"💼", label:"Servizi di lavoro"},
              {icon:"🚛", label:"Camion per traslochi"},
              {icon:"📺", label:"Consegna TV"},
              {icon:"🔧", label:"Consegna attrezzi"},
              {icon:"🪴", label:"Consegna piante"},
              {icon:"🏪", label:"Consegna in negozio"},
            ].map(({icon, label}) => (
              <div key={label} style={secStyles.serviceItem as React.CSSProperties}>
                <span style={secStyles.serviceIcon as React.CSSProperties}>{icon}</span>
                <span style={secStyles.serviceLabel as React.CSSProperties}>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── SEZIONE 3: Diventa uno di noi ── */}
        <section style={secStyles.joinSection as React.CSSProperties} className="tuportu-join">
          <div style={secStyles.joinContent as React.CSSProperties} className="tuportu-join-content">
            <div>
              <h2 style={secStyles.joinTitle as React.CSSProperties}>Diventa uno di noi</h2>
              <p style={secStyles.joinDesc as React.CSSProperties}>Guadagna soldi con il tuo furgone su richiesta</p>
            </div>
            <button style={secStyles.joinBtn as React.CSSProperties}>Contattaci</button>
            <div style={secStyles.truckEmoji as React.CSSProperties} className="tuportu-truck">🚚</div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={footerStyles.footer as React.CSSProperties}>
          <span style={footerStyles.logo as React.CSSProperties}>Tuportu</span>
          <span style={footerStyles.copy as React.CSSProperties}>© {new Date().getFullYear()} Tuportu. Tutti i diritti riservati.</span>
        </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Outfit', sans-serif; }
        @keyframes float0 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-15px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        a { text-decoration: none; }
        input:focus { outline: none; }
        button { cursor: pointer; font-family: 'Outfit', sans-serif; }

        /* Google Places dropdown */
        .pac-container { font-family:'Outfit',sans-serif !important; border-radius:12px !important; border:1.5px solid #e0e0e0 !important; box-shadow:0 8px 32px rgba(0,0,0,0.10) !important; margin-top:6px !important; overflow:hidden !important; }
        .pac-item { padding:10px 16px !important; font-size:14px !important; color:#333 !important; cursor:pointer !important; border-top:1px solid #f0f0f0 !important; }
        .pac-item:hover { background:#f7f5ff !important; }
        .pac-item-query { font-size:14px !important; font-weight:600 !important; color:#1a1a2e !important; }
        .pac-icon { display:none !important; }
        .pac-matched { color:#5b4fcf !important; font-weight:700 !important; }
        .pac-logo::after { display:none !important; }

        /* ── MOBILE ── */
        @media (max-width: 640px) {
          .tuportu-nav { padding: 14px 20px !important; }
          .tuportu-tagline { display: none; }
          .tuportu-hero { padding-top: 40px !important; padding-left: 20px !important; padding-right: 20px !important; align-items: flex-start !important; }
          .tuportu-hero-content { max-width: 100% !important; }
          .tuportu-address-bar { flex-direction: column !important; border-radius: 16px !important; max-width: 100% !important; }
          .tuportu-input-group { width: 100% !important; padding: 12px 16px !important; }
          .tuportu-bar-divider { width: 100% !important; height: 1px !important; }
          .tuportu-see-prices { width: 100% !important; border-radius: 0 0 14px 14px !important; padding: 14px !important; text-align: center; }
          .tuportu-big-card { padding: 28px 20px !important; border-radius: 20px !important; }
          .tuportu-form-grid { grid-template-columns: 1fr !important; }
          .tuportu-form-actions { flex-direction: column !important; gap: 12px !important; }
          .tuportu-form-actions button { width: 100% !important; justify-content: center; }
          .tuportu-thank-card { padding: 40px 24px !important; }
          .tuportu-items-container { opacity: 0.3; }
          .tuportu-map-container { position: relative; }
          .tuportu-map-container { min-height: 220px !important; }
          .tuportu-two-cards { grid-template-columns: 1fr !important; }
          .tuportu-services-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .tuportu-section { padding: 48px 20px 0 !important; }
          .tuportu-join { margin: 40px 20px !important; padding: 32px 24px !important; }
          .tuportu-join-content { flex-wrap: wrap !important; gap: 20px !important; }
          .tuportu-truck { display: none !important; }
        }
      `}</style>
    </div>
  );
}

const footerStyles = {
  footer: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 80px", borderTop: "1px solid #f0f0f0", background: "#fff" },
  logo: { fontSize: 22, fontWeight: 900, color: "#1a1a2e", letterSpacing: "-1px" },
  copy: { fontSize: 13, color: "#aaa", fontWeight: 400 },
};

const secStyles = {
  section: { padding: "48px 80px 0", background: "#fff" },
  sectionTitle: { fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: "#111", letterSpacing: "-1px", marginBottom: 32 },

  // Two cards
  twoCards: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "stretch" },
  cardPurple: { background: "linear-gradient(135deg, #5b4fcf, #7c6fe0)", borderRadius: 24, padding: 28, overflow: "hidden", display: "flex", flexDirection: "column" },
  cardLabel: { fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 20 },
  cardLabelDark: { fontSize: 18, fontWeight: 800, color: "#1a1a2e", marginBottom: 20 },
  cardYellow: { background: "linear-gradient(135deg, #ffc107, #ffdd57)", borderRadius: 24, padding: 28, display: "flex", flexDirection: "column" },
  mapPlaceholder: { background: "rgba(255,255,255,0.15)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  mapContainer: { borderRadius: 16, overflow: "hidden", flex: 1, marginTop: 12, minHeight: 0, position: "relative" },
  mapPin: { width: 48, height: 48, background: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#5b4fcf", fontWeight: 900, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" },
  mapRoute: { width: 3, height: 40, background: "rgba(255,255,255,0.5)", borderRadius: 4 },
  mapDot: { width: 16, height: 16, background: "#ffe033", borderRadius: "50%", border: "3px solid #fff" },
  mapText: { fontSize: 13, color: "rgba(255,255,255,0.85)", textAlign: "center", marginTop: 8 },

  // Schedule
  scheduleBox: { background: "#fff", borderRadius: 16, padding: "20px 20px", flex: 1, marginTop: 12 },
  scheduleSubLabel: { fontSize: 12, color: "#888", fontWeight: 500, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.4px" },
  daysRow: { display: "flex", gap: 8 },
  dayActive: { width: 44, height: 44, background: "#5b4fcf", color: "#fff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16 },
  dayInactive: { width: 44, height: 44, background: "#f4f4f6", color: "#999", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 16 },
  slotsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  slotActive: { background: "#5b4fcf", color: "#fff", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 700, textAlign: "center" },
  slotInactive: { background: "#f4f4f6", color: "#555", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 500, textAlign: "center" },

  // Services grid
  servicesGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  serviceItem: { display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", border: "1.5px solid #f0f0f0", borderRadius: 14, background: "#fff", transition: "box-shadow 0.2s" },
  serviceIcon: { fontSize: 22, flexShrink: 0 },
  serviceLabel: { fontSize: 13, fontWeight: 500, color: "#333", lineHeight: 1.3 },

  // Join section
  joinSection: { margin: "80px 80px 80px", background: "#f7f5ff", borderRadius: 24, padding: "48px 56px" },
  joinContent: { display: "flex", alignItems: "center", gap: 40 },
  joinTitle: { fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 900, color: "#111", letterSpacing: "-0.5px", marginBottom: 8 },
  joinDesc: { fontSize: 15, color: "#666" },
  joinBtn: { background: "#ffe033", color: "#1a1a2e", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 700, flexShrink: 0, whiteSpace: "nowrap" },
  truckEmoji: { fontSize: 80, marginLeft: "auto", flexShrink: 0 },
};

const styles = {
  page: { fontFamily: "'Outfit', sans-serif", minHeight: "100vh", background: "#ffffff", overflow: "hidden" },
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 48px", borderBottom: "1px solid #f0f0f0", position: "relative", zIndex: 10, background: "#fff" },
  navLeft: { display: "flex", alignItems: "center", gap: 10 },
  logo: { fontSize: 26, fontWeight: 900, color: "#1a1a2e", letterSpacing: "-1px" },
  tagline: { fontSize: 13, color: "#888", fontWeight: 400 },
  navRight: { display: "flex", alignItems: "center", gap: 20 },
  bookBtn: { background: "#5b4fcf", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 14, fontWeight: 600 },
  thankYouPage: { minHeight: "calc(100vh - 65px)", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa", padding: "32px 16px" },
  thankYouCard: { background: "#fff", borderRadius: 24, padding: "56px 48px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 8px 48px rgba(0,0,0,0.08)", animation: "fadeInUp 0.5s ease forwards" },
  checkIcon: { width: 72, height: 72, background: "#5b4fcf", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, color: "#fff", margin: "0 auto 24px", fontWeight: 700 },
  thankYouTitle: { fontSize: 26, fontWeight: 900, color: "#111", letterSpacing: "-0.5px", marginBottom: 12 },
  thankYouDesc: { fontSize: 15, color: "#777", lineHeight: 1.6, marginBottom: 28 },
  backBtn: { background: "transparent", border: "2px solid #5b4fcf", color: "#5b4fcf", borderRadius: 12, padding: "12px 28px", fontSize: 15, fontWeight: 600 },
  bigCard: { background: "#fff", borderRadius: 24, padding: "40px 44px", maxWidth: 580, width: "100%", boxShadow: "0 8px 48px rgba(0,0,0,0.08)", animation: "fadeInUp 0.5s ease forwards" },
  routeHeader: { background: "#f7f5ff", borderRadius: 14, padding: "18px 20px", marginBottom: 20 },
  routeRow: { display: "flex", alignItems: "flex-start", gap: 10 },
  routeIconUp: { fontSize: 16, color: "#5b4fcf", fontWeight: 700, flexShrink: 0, marginTop: 2 },
  routeIconDown: { fontSize: 16, color: "#5b4fcf", fontWeight: 700, flexShrink: 0, marginTop: 2 },
  routeText: { fontSize: 13, color: "#333", fontWeight: 500, lineHeight: 1.4 },
  routeDotted: { borderLeft: "2px dashed #c5bef5", height: 16, marginLeft: 7, marginTop: 4, marginBottom: 4 },
  distanceBox: { display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a2e", borderRadius: 14, padding: "20px 28px", marginBottom: 24 },
  distanceStat: { display: "flex", flexDirection: "column", alignItems: "center", flex: 1 },
  distanceValue: { fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" },
  distanceLabel: { fontSize: 12, color: "#8888aa", fontWeight: 500, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.5px" },
  distanceDivider: { width: 1, height: 40, background: "#333355", margin: "0 20px" },
  distanceLoading: { fontSize: 14, color: "#8888aa" },
  formDivider: { height: 1, background: "#f0f0f0", marginBottom: 24 },
  formTitle: { fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 20 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px", marginBottom: 28 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.4px" },
  fieldInput: { border: "1.5px solid #e0e0e0", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#333", fontFamily: "'Outfit', sans-serif", transition: "border-color 0.2s" },
  fieldError: { fontSize: 11, color: "#e04040", fontWeight: 500 },
  sendErrorMsg: { fontSize: 13, color: "#e04040", marginBottom: 16, textAlign: "center" },
  formActions: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  backBtnSmall: { background: "transparent", border: "2px solid #e0e0e0", color: "#777", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 600 },
  submitBtn: { background: "#5b4fcf", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 15, fontWeight: 700, transition: "opacity 0.2s" },
  hero: { position: "relative", minHeight: "auto", paddingBottom: 80, display: "flex", alignItems: "flex-start", paddingTop: 80, paddingLeft: 80, overflow: "hidden" },
  itemsContainer: { position: "absolute", inset: 0, pointerEvents: "none" },
  itemBubble: { position: "absolute", background: "#f4f4f6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  heroContent: { position: "relative", zIndex: 2, maxWidth: 680 },
  headline: { fontSize: "clamp(48px, 6vw, 88px)", fontWeight: 900, color: "#111", lineHeight: 1.05, letterSpacing: "-2px" },
  highlight: { background: "#ffe033", borderRadius: 12, padding: "0 12px", display: "inline-block" },
  subHeadline: { fontSize: "clamp(40px, 5.5vw, 82px)", fontWeight: 900, color: "#c8c8c8", lineHeight: 1.05, letterSpacing: "-2px", marginTop: 4 },
  desc: { fontSize: 16, color: "#555", marginTop: 24, lineHeight: 1.6, maxWidth: 520 },
  addressBar: { marginTop: 32, display: "flex", alignItems: "center", border: "2px solid #e0e0e0", borderRadius: 16, background: "#fff", overflow: "hidden", maxWidth: 620, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" },
  inputGroup: { display: "flex", alignItems: "center", flex: 1, padding: "14px 16px", gap: 10 },
  inputIcon: { fontSize: 16, color: "#888", flexShrink: 0 },
  input: { border: "none", fontSize: 14, color: "#333", fontFamily: "'Outfit', sans-serif", background: "transparent", width: "100%", fontWeight: 400 },
  divider: { width: 1, height: 36, background: "#e0e0e0", flexShrink: 0 },
  seePricesBtn: { color: "#fff", border: "none", padding: "14px 28px", fontSize: 15, fontWeight: 600, fontFamily: "'Outfit', sans-serif", borderRadius: "0 12px 12px 0", flexShrink: 0, transition: "background 0.3s" },
  dropdown: { position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1.5px solid #e0e0e0", zIndex: 100, marginTop: 4, overflow: "hidden" },
  dropdownItem: { padding: "11px 16px", fontSize: 13, color: "#333", cursor: "pointer", borderBottom: "1px solid #f5f5f5", fontWeight: 400, transition: "background 0.15s" },
};
