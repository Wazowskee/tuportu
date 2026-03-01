'use client';

import { useState, useEffect, useRef, useCallback } from "react";

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

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
  { emoji: "🛍️", size: 58, x: 59, y: 55, delay: 0.4 },
  { emoji: "🪆", size: 50, x: 59, y: 55, delay: 0.4 },
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
  return new Promise((resolve) => {
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

const services = [
  { icon: "🏠", label: "Traslochi residenziali" },
  { icon: "🎓", label: "Traslochi studenti" },
  { icon: "🛋️", label: "Consegna mobili" },
  { icon: "🧺", label: "Consegna elettrodomestici" },
  { icon: "🗑️", label: "Rimozione ingombranti" },
  { icon: "❤️", label: "Donazioni" },
  { icon: "🔧", label: "Attrezzature" },
  { icon: "🪴", label: "Piante" },
  { icon: "📦", label: "Scatole e pacchi" },
  { icon: "🖥️", label: "Elettronica" },
  { icon: "🏋️", label: "Attrezzatura palestra" },
  { icon: "🎨", label: "Opere d'arte" },
  { icon: "📚", label: "Libri e archivi" },
  { icon: "🚲", label: "Biciclette" },
  { icon: "🎹", label: "Strumenti musicali" },
  { icon: "🛺", label: "Veicoli leggeri" },
];

const formFields = [
  { key: "nome", placeholder: "Nome", type: "text" },
  { key: "cognome", placeholder: "Cognome", type: "text" },
  { key: "email", placeholder: "Email", type: "email" },
  { key: "telefono", placeholder: "Telefono", type: "tel" },
];

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

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoadingDistance(true);
    const result = await calcDistance(pickup, dropoff);
    setDistanceInfo(result);
    setLoadingDistance(false);
    setSubmitted(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.nome.trim()) errors.nome = "Campo obbligatorio";
    if (!form.cognome.trim()) errors.cognome = "Campo obbligatorio";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errors.email = "Email non valida";
    if (!form.telefono.trim() || !/^\+?[0-9\s]{8,15}$/.test(form.telefono)) errors.telefono = "Numero non valido";
    return errors;
  };

  const handleSendForm = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
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
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.result === "success") {
        setFormSent(true);
      } else {
        setSendError(true);
      }
    } catch {
      setSendError(true);
    } finally {
      setSendingForm(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormSent(false);
    setPickup("");
    setDropoff("");
    setDistanceInfo(null);
    setForm({ nome: "", cognome: "", email: "", telefono: "" });
    setFormErrors({});
    setSessionKey(k => k + 1);
  };

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Outfit', sans-serif; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float0 { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-12px) rotate(3deg); } }
        @keyframes float1 { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-16px) rotate(-4deg); } }
        @keyframes float2 { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-10px) rotate(5deg); } }
        @keyframes float3 { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-14px) rotate(-3deg); } }
        @keyframes gradientBg { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @media (max-width: 640px) {
          .tuportu-nav { padding: 0 20px !important; }
          .tuportu-tagline { display: none !important; }
          .tuportu-hero { padding: 40px 20px 60px !important; }
          .tuportu-bar { flex-direction: column !important; border-radius: 20px !important; padding: 12px !important; gap: 4px !important; }
          .tuportu-bar-divider { width: 100% !important; height: 1px !important; }
          .tuportu-input-group { width: 100% !important; }
          .tuportu-see-prices-btn { border-radius: 12px !important; width: 100% !important; text-align: center !important; }
          .tuportu-bubbles { display: none !important; }
          .tuportu-two-cards { grid-template-columns: 1fr !important; }
          .tuportu-services-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .tuportu-section { padding: 48px 20px 0 !important; }
          .tuportu-join { margin: 40px 20px !important; padding: 32px 24px !important; }
          .tuportu-join-content { flex-wrap: wrap !important; gap: 20px !important; }
          .tuportu-truck { display: none !important; }
        }
      `}</style>

      {/* Navbar */}
      <nav style={styles.nav} className="tuportu-nav">
        <div style={styles.navLeft}>
          <span style={styles.logo}>Tuportu</span>
          <span style={styles.tagline} className="tuportu-tagline">Traslochi on-demand</span>
        </div>
        <button style={styles.bookBtn} onClick={() => window.open("tel:+390000000000")}>Chiamaci</button>
      </nav>

      {/* Hero */}
      {!submitted ? (
        <section style={styles.hero} className="tuportu-hero">
          <div style={styles.heroContent}>
            <h1 style={styles.headline}>
              <span style={styles.headlineBlack}>Trasporta</span><br />
              <span style={styles.headlineYellow}>di tutto</span>
            </h1>
            <p style={styles.subHeadline}>con un semplice click</p>
            <p style={styles.desc}>In base alle tue esigenze, quando, dove e come vuoi</p>

            {/* Search bar */}
            <div style={styles.bar} className="tuportu-bar">
              <div style={styles.inputGroup} className="tuportu-input-group">
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
              <div style={styles.inputGroup} className="tuportu-input-group">
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
                style={{ ...styles.seePricesBtn, background: canSubmit ? "#5b4fcf" : "#ccc", cursor: canSubmit ? "pointer" : "not-allowed" }}
                className="tuportu-see-prices-btn"
                onClick={handleSubmit}
                disabled={!canSubmit || loadingDistance}
              >
                {loadingDistance ? "Calcolo..." : "Vedi prezzi"}
              </button>
            </div>
          </div>

          {/* Floating bubbles */}
          {mounted && (
            <div style={styles.bubblesArea} className="tuportu-bubbles">
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
                    animation: `float${i % 4} ${3 + (i % 3)}s ease-in-out ${item.delay}s infinite`,
                    fontSize: item.size * 0.45,
                  }}
                >
                  {item.emoji}
                </div>
              ))}
            </div>
          )}
        </section>
      ) : formSent ? (
        /* Thank you */
        <section style={styles.formSection}>
          <div style={styles.thankYouCard}>
            <div style={styles.checkIcon}>✓</div>
            <h2 style={styles.thankYouTitle}>Richiesta inviata!</h2>
            <p style={styles.thankYouDesc}>Ti contatteremo presto per confermare il tuo trasporto.</p>
            <button style={styles.backBtn} onClick={handleReset}>Torna alla home</button>
          </div>
        </section>
      ) : (
        /* Booking form */
        <section style={styles.formSection}>
          <div style={styles.bigCard}>
            <button style={styles.backLink} onClick={handleReset}>← Modifica percorso</button>

            {/* Route summary */}
            <div style={styles.routeBox}>
              <div style={styles.routeRow}>
                <span style={styles.routeIconUp}>↑</span>
                <span style={styles.routeText}>{pickup}</span>
              </div>
              <div style={styles.routeDivider} />
              <div style={styles.routeRow}>
                <span style={styles.routeIconDown}>↓</span>
                <span style={styles.routeText}>{dropoff}</span>
              </div>
            </div>

            {distanceInfo && (
              <div style={styles.distanceBadge}>
                🚛 {distanceInfo.distance} · ⏱ {distanceInfo.duration}
              </div>
            )}

            <h2 style={styles.formTitle}>I tuoi dati</h2>
            <div style={styles.formGrid}>
              {formFields.map(({ key, placeholder, type }) => (
                <div key={key}>
                  <input
                    style={{ ...styles.fieldInput, borderColor: formErrors[key] ? "#e53e3e" : "#e0e0e0" }}
                    type={type}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={e => {
                      setForm(f => ({ ...f, [key]: e.target.value }));
                      setFormErrors(err => ({ ...err, [key]: undefined }));
                    }}
                  />
                  {formErrors[key] && <p style={styles.fieldError}>{formErrors[key]}</p>}
                </div>
              ))}
            </div>

            {sendError && <p style={styles.sendError}>Errore nell'invio. Riprova.</p>}

            <button
              style={{ ...styles.submitBtn, opacity: sendingForm ? 0.7 : 1 }}
              onClick={handleSendForm}
              disabled={sendingForm}
            >
              {sendingForm ? "Invio in corso..." : "Richiedi preventivo"}
            </button>
          </div>
        </section>
      )}

      {/* Section: Delivery */}
      <section style={secStyles.section} className="tuportu-section">
        <h2 style={secStyles.sectionTitle}>Consegne e trasporti su richiesta</h2>
        <div style={secStyles.twoCards} className="tuportu-two-cards">
          {/* Purple card */}
          <div style={secStyles.cardPurple}>
            <p style={secStyles.cardLabel}>Tracciamenti in tempo reale</p>
            <div style={secStyles.mapContainer}>
              <img
                src="https://i.postimg.cc/7YTGHNSF/SVG.jpg"
                alt="Mappa percorso"
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16, display: "block", position: "absolute", top: 0, left: 0 }}
              />
            </div>
          </div>
          {/* Yellow card */}
          <div style={secStyles.cardYellow}>
            <p style={secStyles.cardLabelDark}>Scegli data e ora</p>
            <div style={secStyles.scheduleBox}>
              <p style={secStyles.scheduleSubLabel}>Giorno</p>
              <div style={secStyles.daysRow}>
                {[12, 13, 14, 15].map(d => (
                  <div key={d} style={d === 13 ? secStyles.dayActive : secStyles.dayInactive}>{d}</div>
                ))}
              </div>
              <p style={{ ...secStyles.scheduleSubLabel, marginTop: 16 }}>Orario</p>
              <div style={secStyles.slotsGrid}>
                {["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"].map((t, i) => (
                  <div key={t} style={i === 1 ? secStyles.slotActive : secStyles.slotInactive}>{t}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Services */}
      <section style={secStyles.section} className="tuportu-section">
        <h2 style={secStyles.sectionTitle}>Un camion per ogni occasione</h2>
        <div style={secStyles.servicesGrid} className="tuportu-services-grid">
          {services.map((s, i) => (
            <div key={i} style={secStyles.serviceItem}>
              <span style={secStyles.serviceIcon}>{s.icon}</span>
              <span style={secStyles.serviceLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Join */}
      <div style={secStyles.joinSection} className="tuportu-join">
        <div style={secStyles.joinContent} className="tuportu-join-content">
          <div>
            <h2 style={secStyles.joinTitle}>Diventa uno di noi</h2>
            <p style={secStyles.joinDesc}>Hai un furgone? Lavora con noi e guadagna quando vuoi.</p>
          </div>
          <button style={secStyles.joinBtn}>Contattaci</button>
          <span style={secStyles.truckEmoji} className="tuportu-truck">🚛</span>
        </div>
      </div>

      {/* Footer */}
      <footer style={footerStyles.footer}>
        <span style={footerStyles.logo}>Tuportu</span>
        <span style={footerStyles.copy}>© {new Date().getFullYear()} Tuportu</span>
      </footer>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f9f9fb", fontFamily: "'Outfit', sans-serif" },
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 80px", height: 65, background: "#fff", borderBottom: "1px solid #f0f0f0", position: "sticky", top: 0, zIndex: 100 },
  navLeft: { display: "flex", alignItems: "center", gap: 12 },
  logo: { fontSize: 22, fontWeight: 900, color: "#1a1a2e", letterSpacing: "-1px" },
  tagline: { fontSize: 13, color: "#888", fontWeight: 400 },
  bookBtn: { background: "#5b4fcf", color: "#fff", border: "none", borderRadius: 12, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  hero: { minHeight: "auto", paddingBottom: 80, padding: "60px 80px 80px", position: "relative", overflow: "hidden", background: "#fff" },
  heroContent: { maxWidth: 560, position: "relative", zIndex: 2 },
  headline: { fontSize: "clamp(48px, 6vw, 88px)", fontWeight: 900, color: "#111", lineHeight: 1.05, letterSpacing: "-2px" },
  headlineBlack: { color: "#111" },
  headlineYellow: { background: "#ffe033", borderRadius: 12, padding: "0 12px", color: "#111", display: "inline-block" },
  subHeadline: { fontSize: "clamp(40px, 5.5vw, 82px)", fontWeight: 900, color: "#c8c8c8", lineHeight: 1.05, letterSpacing: "-2px", marginTop: 0 },
  desc: { fontSize: 17, color: "#555", marginTop: 16, lineHeight: 1.6, maxWidth: 420 },
  bar: { display: "flex", alignItems: "center", background: "#fff", borderRadius: 18, boxShadow: "0 4px 32px rgba(0,0,0,0.10)", padding: "6px 6px 6px 20px", marginTop: 36, maxWidth: 620, gap: 0, border: "1.5px solid #ececec" },
  inputGroup: { display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 },
  inputIcon: { fontSize: 16, color: "#5b4fcf", fontWeight: 700, flexShrink: 0 },
  input: { border: "none", outline: "none", fontSize: 15, color: "#222", background: "transparent", width: "100%", fontFamily: "'Outfit', sans-serif" },
  divider: { width: 1, height: 32, background: "#e8e8e8", margin: "0 8px", flexShrink: 0 },
  seePricesBtn: { color: "#fff", border: "none", padding: "14px 28px", fontSize: 15, fontWeight: 600, fontFamily: "'Outfit', sans-serif", borderRadius: "0 12px 12px 0", flexShrink: 0, transition: "background 0.3s" },
  bubblesArea: { position: "absolute", top: 0, right: 0, width: "55%", height: "100%", pointerEvents: "none", zIndex: 1 },
  itemBubble: { position: "absolute", borderRadius: "50%", background: "#f5f5f7", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" },
  formSection: { display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 20px", minHeight: "calc(100vh - 65px)" },
  thankYouCard: { background: "#fff", borderRadius: 24, padding: "56px 48px", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 8px 48px rgba(0,0,0,0.08)", animation: "fadeInUp 0.5s ease forwards" },
  checkIcon: { width: 64, height: 64, background: "#5b4fcf", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#fff", margin: "0 auto 24px", fontWeight: 700 },
  thankYouTitle: { fontSize: 28, fontWeight: 800, color: "#111", letterSpacing: "-0.5px", marginBottom: 12 },
  thankYouDesc: { fontSize: 16, color: "#777", lineHeight: 1.6, marginBottom: 32 },
  backBtn: { background: "transparent", border: "2px solid #5b4fcf", color: "#5b4fcf", borderRadius: 12, padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  bigCard: { background: "#fff", borderRadius: 24, padding: "40px 44px", maxWidth: 560, width: "100%", boxShadow: "0 8px 48px rgba(0,0,0,0.08)", animation: "fadeInUp 0.5s ease forwards" },
  backLink: { background: "none", border: "none", color: "#5b4fcf", fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 24, display: "block", padding: 0 },
  routeBox: { background: "#f7f5ff", borderRadius: 16, padding: "16px 20px", marginBottom: 16 },
  routeRow: { display: "flex", alignItems: "flex-start", gap: 12 },
  routeDivider: { height: 1, background: "#e8e4ff", margin: "10px 0" },
  routeIconUp: { fontSize: 16, color: "#5b4fcf", fontWeight: 700, flexShrink: 0, marginTop: 2 },
  routeIconDown: { fontSize: 16, color: "#5b4fcf", fontWeight: 700, flexShrink: 0, marginTop: 2 },
  routeText: { fontSize: 14, color: "#333", lineHeight: 1.4 },
  distanceBadge: { background: "#f0f0f0", borderRadius: 10, padding: "10px 16px", fontSize: 14, color: "#555", marginBottom: 24, display: "inline-block" },
  formTitle: { fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 16 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 },
  fieldInput: { width: "100%", border: "1.5px solid #e0e0e0", borderRadius: 12, padding: "13px 16px", fontSize: 15, outline: "none", fontFamily: "'Outfit', sans-serif", color: "#222" },
  fieldError: { fontSize: 12, color: "#e53e3e", marginTop: 4 },
  sendError: { fontSize: 14, color: "#e53e3e", marginBottom: 12 },
  submitBtn: { width: "100%", background: "#5b4fcf", color: "#fff", border: "none", borderRadius: 14, padding: "16px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" },
};

const secStyles = {
  section: { padding: "48px 80px 0" },
  sectionTitle: { fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#111", letterSpacing: "-1px", marginBottom: 24 },
  twoCards: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "stretch" },
  cardPurple: { background: "linear-gradient(135deg, #5b4fcf, #7c6fe0)", borderRadius: 24, padding: 28, overflow: "hidden", display: "flex", flexDirection: "column" },
  cardYellow: { background: "linear-gradient(135deg, #ffc107, #ffdd57)", borderRadius: 24, padding: 28, display: "flex", flexDirection: "column" },
  cardLabel: { fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 12 },
  cardLabelDark: { fontSize: 18, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 },
  mapContainer: { borderRadius: 16, overflow: "hidden", flex: 1, marginTop: 12, minHeight: 0, position: "relative" },
  scheduleBox: { background: "#fff", borderRadius: 16, padding: "20px 20px", flex: 1, marginTop: 12 },
  scheduleSubLabel: { fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.4px" },
  daysRow: { display: "flex", gap: 8 },
  dayActive: { width: 40, height: 40, background: "#5b4fcf", color: "#fff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 },
  dayInactive: { width: 40, height: 40, background: "#f4f4f6", color: "#999", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 14 },
  slotsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 },
  slotActive: { background: "#5b4fcf", color: "#fff", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 700, textAlign: "center" },
  slotInactive: { background: "#f4f4f6", color: "#555", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 500, textAlign: "center" },
  servicesGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  serviceItem: { background: "#fff", borderRadius: 16, padding: "16px 14px", display: "flex", alignItems: "center", gap: 10, border: "1.5px solid #f0f0f0" },
  serviceIcon: { fontSize: 22, flexShrink: 0 },
  serviceLabel: { fontSize: 13, fontWeight: 600, color: "#333", lineHeight: 1.3 },
  joinSection: { background: "#f7f5ff", borderRadius: 24, margin: "40px 80px", padding: "36px 48px" },
  joinContent: { display: "flex", alignItems: "center", gap: 40 },
  joinTitle: { fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "#111", letterSpacing: "-0.5px", marginBottom: 8 },
  joinDesc: { fontSize: 16, color: "#666" },
  joinBtn: { background: "#ffe033", color: "#1a1a2e", border: "none", borderRadius: 14, padding: "14px 32px", fontSize: 15, fontWeight: 700, flexShrink: 0, whiteSpace: "nowrap", cursor: "pointer" },
  truckEmoji: { fontSize: 64, marginLeft: "auto", flexShrink: 0 },
};

const footerStyles = {
  footer: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 80px", borderTop: "1px solid #f0f0f0", marginTop: 48 },
  logo: { fontSize: 22, fontWeight: 900, color: "#1a1a2e", letterSpacing: "-1px" },
  copy: { fontSize: 13, color: "#aaa", fontWeight: 400 },
};
