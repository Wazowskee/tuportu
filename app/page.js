'use client';

import { useState, useEffect, useRef, useCallback } from "react";

const GOOGLE_API_KEY = "AIzaSyCtqwdf34gJt0WnKtVtXurDAqh2E0UgmJY"; // ← sostituisci con la tua key

const items = [
  { emoji: "🕐", size, x, y, delay },
  { emoji: "⚽", size, x, y, delay.15 },
  { emoji: "🪴", size, x, y, delay.3 },
  { emoji: "🧸", size, x, y, delay.1 },
  { emoji: "🖼️", size, x, y, delay.25 },
  { emoji: "⚙️", size, x, y, delay.4 },
  { emoji: "🚲", size, x, y, delay.2 },
  { emoji: "📦", size, x, y, delay.35 },
  { emoji: "📺", size, x, y, delay.05 },
  { emoji: "🛏️", size, x, y, delay.45 },
  { emoji: "🏺", size, x, y, delay.2 },
  { emoji: "🪑", size, x, y, delay.3 },
  { emoji: "🗄️", size, x, y, delay.1 },
  { emoji: "🖥️", size, x, y, delay.5 },
  { emoji: "🛍️", size, x, y, delay.4 },
];

function useGoogleAutocomplete(inputRef, onSelect, sessionKey) {
  useEffect(() => {
    if (!inputRef.current) return;
    const interval = setInterval(() => {
      if (typeof window !== "undefined" && window.google?.maps?.places) {
        clearInterval(interval);
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
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

function calcDistance(origin, destination) {
  return new Promise<{distance, duration} | null>((resolve) => {
    const interval = setInterval(() => {
      if (typeof window !== "undefined" && window.google?.maps) {
        clearInterval(interval);
        const service = new window.google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
          {
            origins: [origin],
            destinations: [destination],
            travelMode: window.google.maps.TravelMode.DRIVING,
            unitSystem: window.google.maps.UnitSystem.METRIC,
          },
          (response, status) => {
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
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [loadingDistance, setLoadingDistance] = useState(false);
  const [sendingForm, setSendingForm] = useState(false);
  const [sendError, setSendError] = useState(false);

  const [form, setForm] = useState({ nome: "", cognome: "", email: "", telefono: "" });
  const [formErrors, setFormErrors] = useState({});
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
    const errors = {};
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
      nome.nome,
      cognome.cognome,
      email.email,
      telefono.telefono,
      partenza,
      destinazione,
      distanza?.distance ?? "N/D",
      tempo?.duration ?? "N/D",
    };

    try {
      await fetch("https://script.google.com/macros/s/AKfycbzWCGoqDF98I8CjWpGbo-JHipYO4jMUd3tSJyzIP_Xts8USHUl4XZ3f6icx1p8btaye/exec", {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body.stringify(payload),
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
    <div style={styles.page}>
      {/* Navbar */}
      <nav style={styles.nav} className="tuportu-nav">
        <div style={styles.navLeft}>
          <span style={styles.logo}>Tuportu</span>
          <span style={styles.tagline} className="tuportu-tagline">Traslochi on-demand</span>
        </div>
        <div style={styles.navRight}>
          <button style={styles.bookBtn}>Chiamaci</button>
        </div>
      </nav>

      {submitted ? (
        <div style={styles.thankYouPage}>
          {formSent ? (
            /* ── Conferma finale ── */
            <div style={styles.thankYouCard} className="tuportu-thank-card">
              <div style={styles.checkIcon}>✓</div>
              <h2 style={styles.thankYouTitle}>Grazie per la tua richiesta!</h2>
              <p style={styles.thankYouDesc}>Ti contatteremo a breve per fornirti il preventivo.</p>
              <button style={styles.backBtn} onClick={handleReset}>← Nuova richiesta</button>
            </div>
          ) : (
            /* ── Card distanza + form ── */
            <div style={styles.bigCard} className="tuportu-big-card">
              {/* Riepilogo percorso */}
              <div style={styles.routeHeader}>
                <div style={styles.routeRow}>
                  <span style={styles.routeIconUp}>↑</span>
                  <span style={styles.routeText}>{pickup}</span>
                </div>
                <div style={styles.routeDotted} />
                <div style={styles.routeRow}>
                  <span style={styles.routeIconDown}>↓</span>
                  <span style={styles.routeText}>{dropoff}</span>
                </div>
              </div>

              {/* Distanza */}
              <div style={styles.distanceBox}>
                {loadingDistance ? (
                  <span style={styles.distanceLoading}>Calcolo distanza…</span>
                ) : distanceInfo ? (
                  <>
                    <div style={styles.distanceStat}>
                      <span style={styles.distanceValue}>{distanceInfo.distance}</span>
                      <span style={styles.distanceLabel}>distanza</span>
                    </div>
                    <div style={styles.distanceDivider} />
                    <div style={styles.distanceStat}>
                      <span style={styles.distanceValue}>{distanceInfo.duration}</span>
                      <span style={styles.distanceLabel}>tempo stimato</span>
                    </div>
                  </>
                ) : (
                  <span style={styles.distanceLoading}>Impossibile calcolare la distanza</span>
                )}
              </div>

              <div style={styles.formDivider} />

              {/* Form */}
              <p style={styles.formTitle}>Lasciaci i tuoi contatti</p>
              <div style={styles.formGrid} className="tuportu-form-grid">
                {[
                  { key: "nome", label: "Nome", type: "text", placeholder: "Mario" },
                  { key: "cognome", label: "Cognome", type: "text", placeholder: "Rossi" },
                  { key: "email", label: "Email", type: "email", placeholder: "mario@email.com" },
                  { key: "telefono", label: "Telefono", type: "tel", placeholder: "+39 333 000 0000" },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key} style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>{label}</label>
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
                        borderColor[key] ? "#e04040" : "#e0e0e0",
                      }}
                    />
                    {formErrors[key] && <span style={styles.fieldError}>{formErrors[key]}</span>}
                  </div>
                ))}
              </div>

              {sendError && (
                <p style={styles.sendErrorMsg}>
                  ⚠️ Errore durante l'invio. Riprova o contattaci direttamente.
                </p>
              )}

              <div style={styles.formActions} className="tuportu-form-actions">
                <button style={styles.backBtnSmall} onClick={handleReset}>← Indietro</button>
                <button
                  style={{
                    ...styles.submitBtn,
                    opacity ? 0.7 : 1,
                    cursor ? "wait" : "pointer",
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
        <section style={styles.hero} className="tuportu-hero">
          <div style={styles.itemsContainer} className="tuportu-items-container">
            {items.map((item, i) => (
              <div
                key={i}
                style={{
                  ...styles.itemBubble,
                  width.size,
                  height.size,
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  opacity ? 1 : 0,
                  transform ? "translateY(0)" : "translateY(20px)",
                  transition: `opacity 0.6s ease ${item.delay}s, transform 0.6s ease ${item.delay}s`,
                  animation: `float${i % 3} ${3 + (i % 2)}s ease-in-out ${item.delay}s infinite`,
                  fontSize.size * 0.45,
                }}
              >
                {item.emoji}
              </div>
            ))}
          </div>

          <div style={styles.heroContent} className="tuportu-hero-content">
            <h1 style={{
              ...styles.headline,
              opacity ? 1 : 0,
              transform ? "translateY(0)" : "translateY(30px)",
              transition: "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s",
            }}>
              Trasporta <span style={styles.highlight}>di tutto</span>
            </h1>
            <h2 style={{
              ...styles.subHeadline,
              opacity ? 1 : 0,
              transform ? "translateY(0)" : "translateY(30px)",
              transition: "opacity 0.7s ease 0.35s, transform 0.7s ease 0.35s",
            }}>
              con un semplice click
            </h2>
            <p style={{
              ...styles.desc,
              opacity ? 1 : 0,
              transition: "opacity 0.7s ease 0.5s",
            }}>
              In base alle tue esigenze, quando, dove e come vuoi
            </p>

            <div className="tuportu-address-bar" style={{
              ...styles.addressBar,
              opacity ? 1 : 0,
              transform ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.7s ease 0.6s, transform 0.7s ease 0.6s",
            }}>
              <div style={{...styles.inputGroup, position:"relative", flex:1}} className="tuportu-input-group">
                <span style={styles.inputIcon}>↑</span>
                <input
                  key={`pickup-${sessionKey}`}
                  ref={pickupRef}
                  style={styles.input}
                  placeholder="Indirizzo di partenza"
                  value={pickup}
                  onChange={e => setPickup(e.target.value)}
                />
                </div>
              <div style={styles.divider} className="tuportu-bar-divider" />
              <div style={{...styles.inputGroup, position:"relative", flex:1}} className="tuportu-input-group">
                <span style={styles.inputIcon}>↓</span>
                <input
                  key={`dropoff-${sessionKey}`}
                  ref={dropoffRef}
                  style={styles.input}
                  placeholder="Indirizzo di destinazione"
                  value={dropoff}
                  onChange={e => setDropoff(e.target.value)}
                />
                </div>
              <button
                className="tuportu-see-prices"
                style={{
                  ...styles.seePricesBtn,
                  background ? "#5b4fcf" : "#c8c8d0",
                  cursor ? "pointer" : "not-allowed",
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

        {/* ── SEZIONE 1 e trasporti ── */}
        <section style={secStyles.section} className="tuportu-section">
          <h2 style={secStyles.sectionTitle}>Consegne e trasporti su richiesta</h2>
          <div style={secStyles.twoCards} className="tuportu-two-cards">
            {/* Card tracciamento */}
            <div style={secStyles.cardPurple}>
              <p style={secStyles.cardLabel}>Tracciamenti in tempo reale</p>
              <div style={secStyles.mapContainer} className="tuportu-map-container">
                <img
                  src="https://i.postimg.cc/7YTGHNSF/SVG.jpg"
                  alt="mappa città"
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius, display: "block", position: "absolute", top, left }}
                />
              </div>
            </div>
            {/* Card scheduling */}
            <div style={secStyles.cardYellow}>
              <p style={secStyles.cardLabelDark}>Quando vuoi in base alle esigenze</p>
              <div style={secStyles.scheduleBox}>
                <p style={secStyles.scheduleSubLabel}>Seleziona il giorno</p>
                <div style={secStyles.daysRow}>
                  {["12","13","14","15"].map((d,i) => (
                    <div key={d} style={i===0 ? secStyles.dayActive : secStyles.dayInactive}>{d}</div>
                  ))}
                </div>
                <p style={{...secStyles.scheduleSubLabel, marginTop:16}}>Seleziona l&apos;orario</p>
                <div style={secStyles.slotsGrid}>
                  {["Quanto prima","14.00 - 15.00","15.00 - 16.00","16.00 - 17.00"].map((s,i) => (
                    <div key={s} style={i===0 ? secStyles.slotActive : secStyles.slotInactive}>{s}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SEZIONE 2 ── */}
        <section style={secStyles.section} className="tuportu-section">
          <h2 style={secStyles.sectionTitle}>Un camion per ogni occasione</h2>
          <div style={secStyles.servicesGrid} className="tuportu-services-grid">
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
              <div key={label} style={secStyles.serviceItem}>
                <span style={secStyles.serviceIcon}>{icon}</span>
                <span style={secStyles.serviceLabel}>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── SEZIONE 3 uno di noi ── */}
        <section style={secStyles.joinSection} className="tuportu-join">
          <div style={secStyles.joinContent} className="tuportu-join-content">
            <div>
              <h2 style={secStyles.joinTitle}>Diventa uno di noi</h2>
              <p style={secStyles.joinDesc}>Guadagna soldi con il tuo furgone su richiesta</p>
            </div>
            <button style={secStyles.joinBtn}>Contattaci</button>
            <div style={secStyles.truckEmoji} className="tuportu-truck">🚚</div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={footerStyles.footer}>
          <span style={footerStyles.logo}>Tuportu</span>
          <span style={footerStyles.copy}>© {new Date().getFullYear()} Tuportu. Tutti i diritti riservati.</span>
        </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;900&display=swap');
        * { box-sizing-box; margin; padding; }
        body { font-family: 'Outfit', sans-serif; }
        @keyframes float0 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-15px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        a { text-decoration; }
        input:focus { outline; }
        button { cursor; font-family: 'Outfit', sans-serif; }

        /* Google Places dropdown */
        .pac-container { font-family:'Outfit',sans-serif !important; border-radius:12px !important; border:1.5px solid #e0e0e0 !important; box-shadow:0 8px 32px rgba(0,0,0,0.10) !important; margin-top:6px !important; overflow:hidden !important; }
        .pac-item { padding:10px 16px !important; font-size:14px !important; color:#333 !important; cursor:pointer !important; border-top:1px solid #f0f0f0 !important; }
        .pac-item:hover { background:#f7f5ff !important; }
        .pac-item-query { font-size:14px !important; font-weight:600 !important; color:#1a1a2e !important; }
        .pac-icon { display:none !important; }
        .pac-matched { color:#5b4fcf !important; font-weight:700 !important; }
        .pac-logo::after { display:none !important; }

        /* ── MOBILE ── */
        @media (max-width) {
          .tuportu-nav { padding 20px !important; }
          .tuportu-tagline { display; }
          .tuportu-hero { padding-top !important; padding-left !important; padding-right !important; align-items-start !important; }
          .tuportu-hero-content { max-width% !important; }
          .tuportu-address-bar { flex-direction !important; border-radius !important; max-width% !important; }
          .tuportu-input-group { width% !important; padding 16px !important; }
          .tuportu-bar-divider { width% !important; height !important; }
          .tuportu-see-prices { width% !important; border-radius 0 14px 14px !important; padding !important; text-align; }
          .tuportu-big-card { padding 20px !important; border-radius !important; }
          .tuportu-form-grid { grid-template-columns !important; }
          .tuportu-form-actions { flex-direction !important; gap !important; }
          .tuportu-form-actions button { width% !important; justify-content; }
          .tuportu-thank-card { padding 24px !important; }
          .tuportu-items-container { opacity.3; }
          .tuportu-map-container { position; }
          .tuportu-map-container { min-height !important; }
          .tuportu-two-cards { grid-template-columns !important; }
          .tuportu-services-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .tuportu-section { padding 20px 0 !important; }
          .tuportu-join { margin 20px !important; padding 24px !important; }
          .tuportu-join-content { flex-wrap !important; gap !important; }
          .tuportu-truck { display !important; }
        }
      `}</style>
    </div>
  );
}

const footerStyles = {
  footer: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 80px", borderTop: "1px solid #f0f0f0", background: "#fff" },
  logo: { fontSize, fontWeight, color: "#1a1a2e", letterSpacing: "-1px" },
  copy: { fontSize, color: "#aaa", fontWeight },
};

const secStyles = {
  section: { padding: "48px 80px 0", background: "#fff" },
  sectionTitle: { fontSize: "clamp(28px, 4vw, 42px)", fontWeight, color: "#111", letterSpacing: "-1px", marginBottom },

  // Two cards
  twoCards: { display: "grid", gridTemplateColumns: "1fr 1fr", gap, alignItems: "stretch" },
  cardPurple: { background: "linear-gradient(135deg, #5b4fcf, #7c6fe0)", borderRadius, padding, overflow: "hidden", display: "flex", flexDirection: "column" },
  cardLabel: { fontSize, fontWeight, color: "#fff", marginBottom },
  cardLabelDark: { fontSize, fontWeight, color: "#1a1a2e", marginBottom },
  cardYellow: { background: "linear-gradient(135deg, #ffc107, #ffdd57)", borderRadius, padding, display: "flex", flexDirection: "column" },
  mapPlaceholder: { background: "rgba(255,255,255,0.15)", borderRadius, padding, display: "flex", flexDirection: "column", alignItems: "center", gap },
  mapContainer: { borderRadius, overflow: "hidden", flex, marginTop, minHeight, position: "relative" },
  mapPin: { width, height, background: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize, color: "#5b4fcf", fontWeight, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" },
  mapRoute: { width, height, background: "rgba(255,255,255,0.5)", borderRadius },
  mapDot: { width, height, background: "#ffe033", borderRadius: "50%", border: "3px solid #fff" },
  mapText: { fontSize, color: "rgba(255,255,255,0.85)", textAlign: "center", marginTop },

  // Schedule
  scheduleBox: { background: "#fff", borderRadius, padding: "20px 20px", flex, marginTop },
  scheduleSubLabel: { fontSize, color: "#888", fontWeight, marginBottom, textTransform: "uppercase", letterSpacing: "0.4px" },
  daysRow: { display: "flex", gap },
  dayActive: { width, height, background: "#5b4fcf", color: "#fff", borderRadius, display: "flex", alignItems: "center", justifyContent: "center", fontWeight, fontSize },
  dayInactive: { width, height, background: "#f4f4f6", color: "#999", borderRadius, display: "flex", alignItems: "center", justifyContent: "center", fontWeight, fontSize },
  slotsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap },
  slotActive: { background: "#5b4fcf", color: "#fff", borderRadius, padding: "10px 14px", fontSize, fontWeight, textAlign: "center" },
  slotInactive: { background: "#f4f4f6", color: "#555", borderRadius, padding: "10px 14px", fontSize, fontWeight, textAlign: "center" },

  // Services grid
  servicesGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap },
  serviceItem: { display: "flex", alignItems: "center", gap, padding: "16px 18px", border: "1.5px solid #f0f0f0", borderRadius, background: "#fff", transition: "box-shadow 0.2s" },
  serviceIcon: { fontSize, flexShrink },
  serviceLabel: { fontSize, fontWeight, color: "#333", lineHeight.3 },

  // Join section
  joinSection: { margin: "80px 80px 80px", background: "#f7f5ff", borderRadius, padding: "48px 56px" },
  joinContent: { display: "flex", alignItems: "center", gap },
  joinTitle: { fontSize: "clamp(24px, 3vw, 36px)", fontWeight, color: "#111", letterSpacing: "-0.5px", marginBottom },
  joinDesc: { fontSize, color: "#666" },
  joinBtn: { background: "#ffe033", color: "#1a1a2e", border: "none", borderRadius, padding: "14px 32px", fontSize, fontWeight, flexShrink, whiteSpace: "nowrap" },
  truckEmoji: { fontSize, marginLeft: "auto", flexShrink },
};

const styles = {
  page: { fontFamily: "'Outfit', sans-serif", minHeight: "100vh", background: "#ffffff", overflow: "hidden" },
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 48px", borderBottom: "1px solid #f0f0f0", position: "relative", zIndex, background: "#fff" },
  navLeft: { display: "flex", alignItems: "center", gap },
  logo: { fontSize, fontWeight, color: "#1a1a2e", letterSpacing: "-1px" },
  tagline: { fontSize, color: "#888", fontWeight },
  navRight: { display: "flex", alignItems: "center", gap },
  bookBtn: { background: "#5b4fcf", color: "#fff", border: "none", borderRadius, padding: "10px 22px", fontSize, fontWeight },
  thankYouPage: { minHeight: "calc(100vh - 65px)", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa", padding: "32px 16px" },
  thankYouCard: { background: "#fff", borderRadius, padding: "56px 48px", maxWidth, width: "100%", textAlign: "center", boxShadow: "0 8px 48px rgba(0,0,0,0.08)", animation: "fadeInUp 0.5s ease forwards" },
  checkIcon: { width, height, background: "#5b4fcf", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize, color: "#fff", margin: "0 auto 24px", fontWeight },
  thankYouTitle: { fontSize, fontWeight, color: "#111", letterSpacing: "-0.5px", marginBottom },
  thankYouDesc: { fontSize, color: "#777", lineHeight.6, marginBottom },
  backBtn: { background: "transparent", border: "2px solid #5b4fcf", color: "#5b4fcf", borderRadius, padding: "12px 28px", fontSize, fontWeight },
  bigCard: { background: "#fff", borderRadius, padding: "40px 44px", maxWidth, width: "100%", boxShadow: "0 8px 48px rgba(0,0,0,0.08)", animation: "fadeInUp 0.5s ease forwards" },
  routeHeader: { background: "#f7f5ff", borderRadius, padding: "18px 20px", marginBottom },
  routeRow: { display: "flex", alignItems: "flex-start", gap },
  routeIconUp: { fontSize, color: "#5b4fcf", fontWeight, flexShrink, marginTop },
  routeIconDown: { fontSize, color: "#5b4fcf", fontWeight, flexShrink, marginTop },
  routeText: { fontSize, color: "#333", fontWeight, lineHeight.4 },
  routeDotted: { borderLeft: "2px dashed #c5bef5", height, marginLeft, marginTop, marginBottom },
  distanceBox: { display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a2e", borderRadius, padding: "20px 28px", marginBottom },
  distanceStat: { display: "flex", flexDirection: "column", alignItems: "center", flex },
  distanceValue: { fontSize, fontWeight, color: "#fff", letterSpacing: "-0.5px" },
  distanceLabel: { fontSize, color: "#8888aa", fontWeight, marginTop, textTransform: "uppercase", letterSpacing: "0.5px" },
  distanceDivider: { width, height, background: "#333355", margin: "0 20px" },
  distanceLoading: { fontSize, color: "#8888aa" },
  formDivider: { height, background: "#f0f0f0", marginBottom },
  formTitle: { fontSize, fontWeight, color: "#111", marginBottom },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px", marginBottom },
  fieldGroup: { display: "flex", flexDirection: "column", gap },
  fieldLabel: { fontSize, fontWeight, color: "#555", textTransform: "uppercase", letterSpacing: "0.4px" },
  fieldInput: { border: "1.5px solid #e0e0e0", borderRadius, padding: "11px 14px", fontSize, color: "#333", fontFamily: "'Outfit', sans-serif", transition: "border-color 0.2s" },
  fieldError: { fontSize, color: "#e04040", fontWeight },
  sendErrorMsg: { fontSize, color: "#e04040", marginBottom, textAlign: "center" },
  formActions: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  backBtnSmall: { background: "transparent", border: "2px solid #e0e0e0", color: "#777", borderRadius, padding: "11px 20px", fontSize, fontWeight },
  submitBtn: { background: "#5b4fcf", color: "#fff", border: "none", borderRadius, padding: "12px 28px", fontSize, fontWeight, transition: "opacity 0.2s" },
  hero: { position: "relative", minHeight: "auto", paddingBottom, display: "flex", alignItems: "flex-start", paddingTop, paddingLeft, overflow: "hidden" },
  itemsContainer: { position: "absolute", inset, pointerEvents: "none" },
  itemBubble: { position: "absolute", background: "#f4f4f6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  heroContent: { position: "relative", zIndex, maxWidth },
  headline: { fontSize: "clamp(48px, 6vw, 88px)", fontWeight, color: "#111", lineHeight.05, letterSpacing: "-2px" },
  highlight: { background: "#ffe033", borderRadius, padding: "0 12px", display: "inline-block" },
  subHeadline: { fontSize: "clamp(40px, 5.5vw, 82px)", fontWeight, color: "#c8c8c8", lineHeight.05, letterSpacing: "-2px", marginTop },
  desc: { fontSize, color: "#555", marginTop, lineHeight.6, maxWidth },
  addressBar: { marginTop, display: "flex", alignItems: "center", border: "2px solid #e0e0e0", borderRadius, background: "#fff", overflow: "hidden", maxWidth, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" },
  inputGroup: { display: "flex", alignItems: "center", flex, padding: "14px 16px", gap },
  inputIcon: { fontSize, color: "#888", flexShrink },
  input: { border: "none", fontSize, color: "#333", fontFamily: "'Outfit', sans-serif", background: "transparent", width: "100%", fontWeight },
  divider: { width, height, background: "#e0e0e0", flexShrink },
  seePricesBtn: { color: "#fff", border: "none", padding: "14px 28px", fontSize, fontWeight, fontFamily: "'Outfit', sans-serif", borderRadius: "0 12px 12px 0", flexShrink, transition: "background 0.3s" },
  dropdown: { position: "absolute", top: "100%", left, right, background: "#fff", borderRadius, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1.5px solid #e0e0e0", zIndex, marginTop, overflow: "hidden" },
  dropdownItem: { padding: "11px 16px", fontSize, color: "#333", cursor: "pointer", borderBottom: "1px solid #f5f5f5", fontWeight, transition: "background 0.15s" },
};
