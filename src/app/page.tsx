export default function Home() {
  const color = "#f59e0b";
  const colorLight = "#fffbeb";
  const colorDark = "#b45309";

  return (
    <main style={{ fontFamily: "var(--font-body)" }}>
      {/* NAVBAR */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #fde68a", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color }}>EntityResolution</span>
          <div style={{ display: "flex", gap: 12 }}>
            <button data-cal-link="wikolabs-team/30min" data-cal-namespace="wk30min" data-cal-config='{"layout":"month_view"}' type="button" target="_blank" rel="noopener noreferrer"
              style={{ background: color, color: "#fff", padding: "8px 20px", borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
              Réserver une démo
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: `linear-gradient(135deg, ${colorLight} 0%, #fff 60%)`, padding: "80px 24px 64px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <span style={{ display: "inline-block", background: "#fde68a", color: colorDark, padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
            Entity Resolution &amp; déduplication ML
          </span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 6vw, 60px)", fontWeight: 800, color: "#78350f", lineHeight: 1.15, marginBottom: 24 }}>
            Un client = un profil.<br />
            <span style={{ color }}>Toujours. À l&apos;échelle.</span>
          </h1>
          <p style={{ fontSize: 18, color: "#4b5563", marginBottom: 40, lineHeight: 1.7 }}>
            Matching ML multi-source 99.3% de précision — un client, un profil unifié, zéro doublon même sur des bases hétérogènes.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 56 }}>
            <button data-cal-link="wikolabs-team/30min" data-cal-namespace="wk30min" data-cal-config='{"layout":"month_view"}' type="button" target="_blank" rel="noopener noreferrer"
              style={{ background: color, color: "#fff", padding: "14px 28px", borderRadius: 10, fontWeight: 700, fontSize: 16, textDecoration: "none" }}>
              Réserver une démo
            </button>
            <a href="https://wa.me/261386626100?text=Bonjour%2C%20je%20souhaite%20discuter%20de%20EntityResolution%20avec%20Wikolabs." target="_blank" rel="noopener noreferrer"
              style={{ background: "#25d366", color: "#fff", padding: "14px 28px", borderRadius: 10, fontWeight: 700, fontSize: 16, textDecoration: "none" }}>
              WhatsApp
            </a>
          </div>
          {/* Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
            {[
              { value: "99.3%", label: "précision" },
              { value: "<10ms", label: "par record" },
              { value: "Millions", label: "de records" },
              { value: "Zero-config", label: "démarrage" },
            ].map((m) => (
              <div key={m.label} style={{ background: "#fff", borderRadius: 12, padding: "20px 16px", boxShadow: "0 1px 4px rgba(245,158,11,0.1)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color }}>{m.value}</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: "#fff", padding: "72px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 800, color: "#78350f", textAlign: "center", marginBottom: 48 }}>
            Une source de vérité unique pour chaque client
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {[
              {
                icon: "🔗",
                title: "Matching ML multi-source",
                desc: "Nom, email, téléphone, adresse, comportement — tous les signaux sont combinés pour relier les profils éparpillés sur vos systèmes.",
              },
              {
                icon: "🔄",
                title: "Déduplication en temps réel",
                desc: "À chaque nouvelle création de compte ou import CRM, EntityResolution détecte et fusionne les doublons immédiatement.",
              },
              {
                icon: "📋",
                title: "Golden record unifié",
                desc: "Un profil maître consolidé par client, synchronisé automatiquement vers votre CRM, DWH et outils marketing. Une seule source de vérité.",
              },
            ].map((f) => (
              <div key={f.title} style={{ background: colorLight, borderRadius: 16, padding: 32, border: "1px solid #fde68a" }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "#78350f", marginBottom: 12 }}>{f.title}</h3>
                <p style={{ color: "#4b5563", lineHeight: 1.7, fontSize: 15 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: colorLight, padding: "72px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 800, color: "#78350f", textAlign: "center", marginBottom: 48 }}>
            Comment ça marche ?
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {[
              {
                step: "01",
                title: "Connectez vos sources",
                desc: "CRM, ERP, base marketing, e-commerce — connexion via API ou export CSV. Toutes les sources sont normalisées automatiquement.",
              },
              {
                step: "02",
                title: "Matching & scoring",
                desc: "Le modèle calcule un score de similarité entre chaque paire d'entités et propose les fusions avec un niveau de confiance.",
              },
              {
                step: "03",
                title: "Golden record unifié",
                desc: "Les entités confirmées sont fusionnées en un profil maître et redistribuées vers tous vos systèmes en temps réel ou en batch.",
              },
            ].map((s) => (
              <div key={s.step} style={{ display: "flex", gap: 24, alignItems: "flex-start", background: "#fff", borderRadius: 16, padding: 28 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 900, color: "#fde68a", minWidth: 56 }}>{s.step}</div>
                <div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "#78350f", marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ color: "#4b5563", lineHeight: 1.7, fontSize: 15 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: color, padding: "72px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 16 }}>
            Des données clients propres dès cette semaine
          </h2>
          <p style={{ color: "#fef3c7", fontSize: 18, marginBottom: 36 }}>Audit de qualité gratuit sur votre base.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button data-cal-link="wikolabs-team/30min" data-cal-namespace="wk30min" data-cal-config='{"layout":"month_view"}' type="button" target="_blank" rel="noopener noreferrer"
              style={{ background: "#fff", color, padding: "14px 28px", borderRadius: 10, fontWeight: 700, fontSize: 16, textDecoration: "none" }}>
              Réserver une démo
            </button>
            <a href="https://wa.me/261386626100?text=Bonjour%2C%20je%20souhaite%20discuter%20de%20EntityResolution%20avec%20Wikolabs." target="_blank" rel="noopener noreferrer"
              style={{ background: "#25d366", color: "#fff", padding: "14px 28px", borderRadius: 10, fontWeight: 700, fontSize: 16, textDecoration: "none" }}>
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#78350f", color: "#fcd34d", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>EntityResolution</div>
          <p style={{ fontSize: 14, marginBottom: 4 }}>
            <a href="mailto:team@wikolabs.com" style={{ color: "#fcd34d", textDecoration: "none" }}>team@wikolabs.com</a>
            {" · "}
            <a href="https://wikolabs.com" target="_blank" rel="noopener noreferrer" style={{ color: "#fcd34d", textDecoration: "none" }}>wikolabs.com</a>
          </p>
          <p style={{ color: "#fcd34d", marginTop: 8, fontSize: 13, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="mailto:team@wikolabs.com" style={{ color: "#fcd34d", textDecoration: "none" }}>team@wikolabs.com</a>
            <span>·</span>
            <a href="tel:+261386626100" style={{ color: "#fcd34d", textDecoration: "none" }}>+261 38 66 261 00</a>
            <span>·</span>
            <button data-cal-link="wikolabs-team/30min" data-cal-namespace="wk30min" data-cal-config='{"layout":"month_view"}' type="button" target="_blank" rel="noopener noreferrer" style={{ color: "#fcd34d", textDecoration: "none" }}>Prendre RDV</button>
          </p>
          <p style={{ fontSize: 13, color: "#f59e0b" }}>© 2026 Wikolabs. Tous droits réservés.</p>
        </div>
      </footer>
    </main>
  );
}
