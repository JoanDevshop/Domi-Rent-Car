import { useState, useEffect, useMemo, useRef } from 'react';
import { DEFAULT_BUSINESS_INFO } from './data';
import { IOSDevice } from './IOSDevice';
import {
  fetchVehicles, upsertVehicle, deleteVehicle, setVehicleAvailability,
  fetchBusinessInfo, updateBusinessInfo,
  signIn, signOut, onAuthChange, getCurrentUser,
  uploadVehicleImage, deleteVehicleImageByUrl,
} from './api';

const fmtMoney = (n) => `US$${Number(n).toLocaleString("en-US")}`;

const Icon = ({ name, size = 20, color = "currentColor", strokeWidth = 2 }) => {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    menu: <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    close: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    back: <><polyline points="15 18 9 12 15 6"/></>,
    chevronRight: <><polyline points="9 18 15 12 9 6"/></>,
    whatsapp: <path d="M20.52 3.48A12 12 0 0 0 3.48 20.52L2 22l1.54-1.42A12 12 0 1 0 20.52 3.48zM12 20.5a8.46 8.46 0 0 1-4.32-1.18l-.31-.18-3.05.81.81-2.97-.2-.31A8.5 8.5 0 1 1 12 20.5zm4.7-6.36c-.26-.13-1.52-.75-1.76-.84s-.41-.13-.58.13-.66.84-.81 1-.3.19-.55.06a6.96 6.96 0 0 1-3.49-3.05c-.26-.45.26-.42.75-1.4.08-.16.04-.3-.02-.43s-.58-1.4-.79-1.92c-.21-.5-.42-.43-.58-.44h-.5a.95.95 0 0 0-.7.32 2.92 2.92 0 0 0-.91 2.18c0 1.28.94 2.52 1.07 2.7s1.85 2.83 4.49 3.97a14.94 14.94 0 0 0 1.5.55 3.6 3.6 0 0 0 1.66.1 2.7 2.7 0 0 0 1.78-1.25 2.18 2.18 0 0 0 .15-1.25c-.06-.11-.23-.18-.5-.31z" fill={color} stroke="none"/>,
    car: <><path d="M5 17h14M3 17V11l2-5h14l2 5v6M7 17v2M17 17v2M7 11h10"/><circle cx="7.5" cy="14.5" r="1.5"/><circle cx="16.5" cy="14.5" r="1.5"/></>,
    seat: <><path d="M5 18v-7a3 3 0 0 1 3-3h6l4 4v6"/><path d="M5 18h14"/></>,
    fuel: <><path d="M3 22V4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v18"/><path d="M3 14h11"/><path d="M14 8h2a2 2 0 0 1 2 2v6a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9l-3-3"/></>,
    cog: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.6.24 1 .82 1 1.51H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    bolt: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    door: <><rect x="6" y="3" width="12" height="18" rx="1"/><circle cx="14" cy="12" r="1"/></>,
    luggage: <><rect x="6" y="6" width="12" height="14" rx="1"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><line x1="10" y1="10" x2="10" y2="16"/><line x1="14" y1="10" x2="14" y2="16"/></>,
    snow: <><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/></>,
    bluetooth: <><polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"/></>,
    gps: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></>,
    star: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    phone: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></>,
    pin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    mail: <><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    award: <><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.6.24 1 .82 1 1.51H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  };
  return <svg {...props}>{paths[name]}</svg>;
};

const FlagStripe = ({ size = 18, className = "" }) => (
  <div className={`flag-stripe ${className}`} style={{ "--sz": size + "px" }} aria-hidden="true" />
);

const waLink = (number, text) =>
  `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

const newVehicleId = () => "v" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function App() {
  const [view, setView] = useState({ name: "home" });
  const [vehicles, setVehicles] = useState([]);
  const [businessInfo, setBusinessInfo] = useState(DEFAULT_BUSINESS_INFO);
  const [adminUser, setAdminUser] = useState(null);
  const [filter, setFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Initial fetch
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [vs, bi, user] = await Promise.all([
          fetchVehicles().catch(e => { console.error('[fetchVehicles]', e); return []; }),
          fetchBusinessInfo().catch(e => { console.error('[fetchBusinessInfo]', e); return DEFAULT_BUSINESS_INFO; }),
          getCurrentUser().catch(() => null),
        ]);
        if (!alive) return;
        setVehicles(vs);
        setBusinessInfo(bi);
        setAdminUser(user);
      } catch (e) {
        if (alive) setLoadError(e.message || 'Error cargando datos');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    const unsub = onAuthChange((u) => setAdminUser(u));
    return () => { alive = false; unsub?.(); };
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setView({ name: "home" }); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const goto = (v) => {
    setView(v);
    window.scrollTo?.(0, 0);
    document.querySelector(".phone-scroll")?.scrollTo?.(0, 0);
  };

  // Mutations centralized here. Optimistic + sync con DB.
  const refreshVehicles = async () => {
    try { setVehicles(await fetchVehicles()); } catch (e) { console.error(e); }
  };

  const saveVehicle = async (v) => {
    const id = v.id || newVehicleId();
    const payload = { ...v, id };
    const saved = await upsertVehicle(payload);
    setVehicles(prev => {
      const exists = prev.some(x => x.id === id);
      return exists ? prev.map(x => x.id === id ? saved : x) : [...prev, saved];
    });
    return saved;
  };

  const removeVehicle = async (id) => {
    const v = vehicles.find(x => x.id === id);
    await deleteVehicle(id);
    setVehicles(prev => prev.filter(x => x.id !== id));
    // limpia imágenes del bucket en background (best-effort)
    if (v) v.images.forEach(url => { deleteVehicleImageByUrl(url).catch(() => {}); });
  };

  const toggleAvailability = async (id) => {
    const v = vehicles.find(x => x.id === id);
    if (!v) return;
    const updated = await setVehicleAvailability(id, !v.available);
    setVehicles(prev => prev.map(x => x.id === id ? updated : x));
  };

  const saveBusiness = async (b) => {
    const saved = await updateBusinessInfo(b);
    setBusinessInfo(saved);
    return saved;
  };

  const ctx = {
    vehicles, businessInfo,
    view, goto, filter, setFilter,
    adminUser, loading, loadError,
    saveVehicle, removeVehicle, toggleAvailability, saveBusiness, refreshVehicles,
  };

  return <DomiPhone ctx={ctx} />;
}

function DomiPhone({ ctx }) {
  const { view } = ctx;
  const screen = (
    <div className="phone-scroll">
      {view.name === "home" && <HomeScreen ctx={ctx} />}
      {view.name === "vehicle" && <VehicleScreen ctx={ctx} vehicleId={view.id} />}
      {view.name === "admin" && <AdminScreen ctx={ctx} />}
      {view.name === "about" && <AboutScreen ctx={ctx} />}
    </div>
  );

  const [isDesktop, setIsDesktop] = useState(typeof window !== "undefined" ? window.innerWidth > 520 : false);
  useEffect(() => {
    const onR = () => setIsDesktop(window.innerWidth > 520);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  if (isDesktop) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0A0A0B",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
        backgroundImage: "radial-gradient(circle at 20% 20%, rgba(225,29,42,0.15), transparent 50%), radial-gradient(circle at 80% 80%, rgba(225,29,42,0.1), transparent 50%)"
      }}>
        <IOSDevice width={402} height={874} dark>
          {screen}
        </IOSDevice>
      </div>
    );
  }
  return <div style={{ height: "100vh", background: "#0A0A0B" }}>{screen}</div>;
}

function HomeScreen({ ctx }) {
  const { vehicles, goto, filter, setFilter, businessInfo: bi, loading, loadError } = ctx;
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState("");

  const categories = useMemo(() => {
    const set = new Set(vehicles.map(v => v.category));
    return ["Todos", ...Array.from(set)];
  }, [vehicles]);

  const filtered = useMemo(() => {
    return vehicles.filter(v => {
      const catOk = filter === "Todos" || v.category === filter;
      const q = search.trim().toLowerCase();
      const qOk = !q || v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [vehicles, filter, search]);

  const featured = vehicles.filter(v => v.featured && v.available);
  const fleetCount = vehicles.length;

  return (
    <div className="home">
      <header className="hero">
        <div className="hero-bg" aria-hidden="true">
          <div className="hero-flag" />
          <div className="hero-vignette" />
        </div>

        <div className="topbar">
          <button className="icon-btn ghost" onClick={() => setMenu(true)} aria-label="Menú">
            <Icon name="menu" size={22} color="#fff" />
          </button>
          <button className="icon-btn ghost" onClick={() => goto({ name: "admin" })} aria-label="Admin">
            <Icon name="lock" size={18} color="#fff" />
          </button>
        </div>

        <div className="hero-content">
          <img src="/assets/logo.png" alt={bi.name} className="hero-logo" />
          <p className="hero-tagline">{bi.tagline}</p>
          <div className="hero-stats">
            <div><strong>{fleetCount}</strong><span>VEHÍCULOS</span></div>
            <div className="divider" />
            <div><strong>{bi.yearsInBusiness}</strong><span>AÑOS</span></div>
            <div className="divider" />
            <div><strong>{bi.rating}★</strong><span>RATING</span></div>
          </div>
        </div>

        <div className="hero-cta-row">
          <button className="btn primary block" onClick={() => document.getElementById("catalog-anchor")?.scrollIntoView({ behavior: "smooth" })}>
            <span>VER CATÁLOGO</span>
            <Icon name="chevronRight" size={18} />
          </button>
        </div>
      </header>

      <section className="search-row">
        <input
          className="search"
          placeholder="Buscar marca, modelo o categoría..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </section>

      {featured.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2><span className="accent-bar" />DESTACADOS</h2>
            <span className="section-sub">Lo mejor de la flota</span>
          </div>
          <div className="featured-rail">
            {featured.map(v => (
              <FeaturedCard key={v.id} v={v} onClick={() => goto({ name: "vehicle", id: v.id })} />
            ))}
          </div>
        </section>
      )}

      <section className="section" id="catalog-anchor">
        <div className="section-head">
          <h2><span className="accent-bar" />CATÁLOGO COMPLETO</h2>
          <span className="section-sub">{filtered.length} vehículos</span>
        </div>
        <div className="chip-row">
          {categories.map(c => (
            <button key={c} className={`chip ${filter === c ? "active" : ""}`} onClick={() => setFilter(c)}>
              {c}
            </button>
          ))}
        </div>

        <div className="grid">
          {filtered.map(v => (
            <VehicleCard key={v.id} v={v} onClick={() => goto({ name: "vehicle", id: v.id })} />
          ))}
          {!loading && filtered.length === 0 && (
            <div className="empty">Sin resultados.</div>
          )}
          {loading && filtered.length === 0 && (
            <div className="empty">Cargando…</div>
          )}
          {loadError && (
            <div className="empty" style={{ color: '#E11D2A' }}>Error: {loadError}</div>
          )}
        </div>
      </section>

      <section className="section why">
        <div className="section-head">
          <h2><span className="accent-bar" />¿POR QUÉ DOMI?</h2>
        </div>
        <div className="why-grid">
          <Perk icon="shield" title="100% Asegurado" sub="Cobertura total incluida" />
          <Perk icon="bolt" title="Entrega Rápida" sub="En menos de 2 horas" />
          <Perk icon="award" title="Flota Premium" sub="Vehículos modelo 2023+" />
          <Perk icon="phone" title="Soporte 24/7" sub="WhatsApp directo" />
        </div>
      </section>

      <section className="contact">
        <h3>¿Listo para arrancar?</h3>
        <p>Contáctanos directamente</p>
        <div className="contact-actions">
          <a className="btn wa-primary block big" href={waLink(bi.whatsapp, `Hola ${bi.name}, quiero información sobre los vehículos disponibles.`)} target="_blank" rel="noreferrer">
            <Icon name="whatsapp" size={18} color="#fff" />
            <span>WHATSAPP</span>
          </a>
          <a className="btn ghost-light block" href={`tel:${(bi.phone || '').replace(/\s|\(|\)|-/g, "")}`}>
            <Icon name="phone" size={16} />
            <span>LLAMAR</span>
          </a>
        </div>
        <div className="contact-info">
          <div><Icon name="pin" size={14} color="#E11D2A" /> <span>{bi.address}</span></div>
          <div><Icon name="clock" size={14} color="#E11D2A" /> <span>{bi.hours}</span></div>
          <div><Icon name="mail" size={14} color="#E11D2A" /> <span>{bi.email}</span></div>
        </div>
        <div className="footer-mark">
          <FlagStripe />
          <small>© 2026 {(bi.name || '').toUpperCase()} · TODOS LOS DERECHOS RESERVADOS</small>
        </div>
      </section>

      <FloatingWA wa={bi.whatsapp} biName={bi.name} />

      {menu && <SideMenu onClose={() => setMenu(false)} ctx={ctx} />}
    </div>
  );
}

function FeaturedCard({ v, onClick }) {
  return (
    <button className="featured-card" onClick={onClick}>
      <div className="fc-img" style={{ backgroundImage: `url(${v.images[0]})` }}>
        <div className="fc-tag">{v.category}</div>
        {!v.available && <div className="fc-unavail">NO DISPONIBLE</div>}
      </div>
      <div className="fc-body">
        <h3>{v.name}</h3>
        <div className="fc-foot">
          <span className="fc-price"><strong>{fmtMoney(v.pricePerDay)}</strong><small>/día</small></span>
          <span className="fc-arrow"><Icon name="chevronRight" size={16} color="#fff" /></span>
        </div>
      </div>
    </button>
  );
}

function VehicleCard({ v, onClick }) {
  return (
    <button className={`vcard ${!v.available ? "disabled" : ""}`} onClick={onClick}>
      <div className="vcard-img" style={{ backgroundImage: `url(${v.images[0]})` }}>
        <span className="vcard-cat">{v.category}</span>
        {!v.available && <span className="vcard-unavail">EN RENTA</span>}
        {v.featured && v.available && <span className="vcard-star"><Icon name="star" size={12} color="#fff" /></span>}
      </div>
      <div className="vcard-body">
        <h3>{v.name}</h3>
        <div className="vcard-meta">
          <span><Icon name="seat" size={12} /> {v.seats}</span>
          <span><Icon name="cog" size={12} /> {(v.transmission || '').slice(0,4)}.</span>
          <span><Icon name="fuel" size={12} /> {v.fuel}</span>
        </div>
        <div className="vcard-price">
          <strong>{fmtMoney(v.pricePerDay)}</strong><small>/día</small>
        </div>
      </div>
    </button>
  );
}

function Perk({ icon, title, sub }) {
  return (
    <div className="perk">
      <div className="perk-icon"><Icon name={icon} size={20} color="#E11D2A" /></div>
      <div>
        <strong>{title}</strong>
        <span>{sub}</span>
      </div>
    </div>
  );
}

function SideMenu({ onClose, ctx }) {
  const { goto, businessInfo: bi } = ctx;
  const go = (v) => { onClose(); setTimeout(() => goto(v), 50); };
  return (
    <div className="side-menu-bg" onClick={onClose}>
      <div className="side-menu" onClick={e => e.stopPropagation()}>
        <div className="sm-head">
          <img src="/assets/logo.png" alt="" />
          <button className="icon-btn" onClick={onClose}><Icon name="close" size={20} color="#fff" /></button>
        </div>
        <nav className="sm-nav">
          <button onClick={() => go({ name: "home" })}><Icon name="car" size={18} /> Catálogo</button>
          <button onClick={() => go({ name: "about" })}><Icon name="award" size={18} /> Sobre Nosotros</button>
          <a href={waLink(bi.whatsapp, `Hola ${bi.name}, quiero información.`)} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={18} /> WhatsApp</a>
          <a href={`tel:${(bi.phone || '').replace(/\s|\(|\)|-/g, "")}`}><Icon name="phone" size={18} /> Llamar</a>
          <button onClick={() => go({ name: "admin" })}><Icon name="lock" size={18} /> Admin</button>
        </nav>
        <div className="sm-foot">
          <FlagStripe />
          <small>{bi.address}</small>
        </div>
      </div>
    </div>
  );
}

function VehicleScreen({ ctx, vehicleId }) {
  const { vehicles, goto, businessInfo: bi } = ctx;
  const v = vehicles.find(x => x.id === vehicleId);
  const [imgIdx, setImgIdx] = useState(0);

  if (!v) return <div className="screen-pad">Vehículo no encontrado.</div>;

  const waMsg = `Hola ${bi.name}, me interesa el ${v.name} (${fmtMoney(v.pricePerDay)}/día). ¿Está disponible?`;

  return (
    <div className="vdetail">
      <div className="vd-gallery">
        <div className="vd-img-wrap" style={{ backgroundImage: `url(${v.images[imgIdx]})` }}>
          <div className="vd-top">
            <button className="icon-btn solid" onClick={() => goto({ name: "home" })}><Icon name="back" size={18} color="#fff" /></button>
            <span className="vd-cat-badge">{v.category}</span>
          </div>
          {!v.available && <div className="vd-unavail-banner">ACTUALMENTE EN RENTA</div>}
        </div>
        {v.images.length > 1 && (
          <div className="vd-thumbs">
            {v.images.map((src, i) => (
              <button key={i} className={`vd-thumb ${i === imgIdx ? "active" : ""}`} onClick={() => setImgIdx(i)}
                style={{ backgroundImage: `url(${src})` }} />
            ))}
          </div>
        )}
      </div>

      <div className="vd-head">
        <div>
          <h1>{v.name}</h1>
          <div className="vd-sub">{v.year} · {v.color}</div>
        </div>
        <div className="vd-price-tag">
          <strong>{fmtMoney(v.pricePerDay)}</strong>
          <small>POR DÍA</small>
        </div>
      </div>

      <div className="spec-grid">
        <SpecBox icon="bolt" label="POTENCIA" value={v.power} />
        <SpecBox icon="cog" label="MOTOR" value={v.engine} />
        <SpecBox icon="seat" label="ASIENTOS" value={`${v.seats} pers.`} />
        <SpecBox icon="door" label="PUERTAS" value={v.doors} />
        <SpecBox icon="fuel" label="COMBUSTIBLE" value={v.fuel} />
        <SpecBox icon="cog" label="TRANSMISIÓN" value={v.transmission} />
        <SpecBox icon="luggage" label="MALETAS" value={v.luggage} />
        <SpecBox icon="snow" label="A/C" value={v.ac ? "Sí" : "No"} />
      </div>

      <div className="vd-section">
        <h3 className="vd-h">CARACTERÍSTICAS</h3>
        <div className="features">
          {v.ac && <Feature icon="snow" label="Aire acondicionado" />}
          {v.bluetooth && <Feature icon="bluetooth" label="Bluetooth / Audio" />}
          {v.gps && <Feature icon="gps" label="GPS Navegación" />}
          <Feature icon="shield" label="Seguro incluido" />
          <Feature icon="award" labelText={`Modelo ${v.year}`} />
          <Feature icon="check" label="Kilometraje libre" />
        </div>
      </div>

      <div className="vd-section">
        <h3 className="vd-h">DESCRIPCIÓN</h3>
        <p className="vd-desc">{v.description}</p>
      </div>

      <div className="vd-section">
        <h3 className="vd-h">TARIFAS</h3>
        <div className="pricing">
          <div className="pricing-row"><span>1 día</span><strong>{fmtMoney(v.pricePerDay)}</strong></div>
          <div className="pricing-row"><span>3 días</span><strong>{fmtMoney(v.pricePerDay * 3)}</strong></div>
          <div className="pricing-row featured"><span>7 días <em>−10%</em></span><strong>{fmtMoney(Math.round(v.pricePerDay * 7 * 0.9))}</strong></div>
          <div className="pricing-row featured"><span>30 días <em>−20%</em></span><strong>{fmtMoney(Math.round(v.pricePerDay * 30 * 0.8))}</strong></div>
        </div>
      </div>

      <div style={{ height: 110 }} />

      <div className="sticky-bar">
        <a
          className={`btn wa-primary block big ${!v.available ? "disabled" : ""}`}
          href={v.available ? waLink(bi.whatsapp, waMsg) : undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!v.available}
          onClick={(e) => { if (!v.available) e.preventDefault(); }}
        >
          <Icon name="whatsapp" size={22} color="#fff" />
          <span>{v.available ? "RENTAR POR WHATSAPP" : "NO DISPONIBLE"}</span>
        </a>
      </div>

      <FloatingWA hide />
    </div>
  );
}

function SpecBox({ icon, label, value }) {
  return (
    <div className="spec-box">
      <Icon name={icon} size={18} color="#E11D2A" />
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function Feature({ icon, label, labelText }) {
  return (
    <div className="feature">
      <span className="f-ico"><Icon name={icon} size={14} color="#E11D2A" /></span>
      <span>{labelText || label}</span>
    </div>
  );
}

function FloatingWA({ hide, wa, biName }) {
  if (hide) return null;
  return (
    <a
      className="fab-wa"
      href={waLink(wa, `Hola ${biName || ""}, quiero información sobre los vehículos.`)}
      target="_blank" rel="noreferrer"
      aria-label="Contactar por WhatsApp"
    >
      <Icon name="whatsapp" size={26} color="#fff" />
    </a>
  );
}

function AboutScreen({ ctx }) {
  const { vehicles, goto, businessInfo: bi } = ctx;
  return (
    <div className="about">
      <div className="rent-top">
        <button className="icon-btn solid" onClick={() => goto({ name: "home" })}><Icon name="back" size={18} color="#fff" /></button>
        <div className="rent-title"><small>SOBRE</small><strong>{bi.name}</strong></div>
        <div style={{ width: 36 }} />
      </div>
      <div className="about-hero">
        <img src="/assets/logo.png" alt="" />
        <h2>Tu socio de confianza</h2>
        <p>Somos la rent car preferida en República Dominicana, con la flota más exclusiva y el mejor servicio personalizado.</p>
      </div>
      <div className="about-stats">
        <div><strong>{vehicles.length}</strong><span>VEHÍCULOS</span></div>
        <div><strong>{Number(bi.happyClients).toLocaleString()}+</strong><span>CLIENTES FELICES</span></div>
        <div><strong>{bi.yearsInBusiness}</strong><span>AÑOS</span></div>
      </div>
      <div className="about-block">
        <h3>NUESTRA MISIÓN</h3>
        <p>Ofrecer una experiencia de movilidad premium, segura y sin complicaciones. Vehículos modernos, precios justos y atención humana 24/7.</p>
      </div>
      <div className="about-block">
        <h3>CONTACTO</h3>
        <div className="ab-info">
          <div><Icon name="pin" size={14} color="#E11D2A" /> {bi.address}</div>
          <div><Icon name="clock" size={14} color="#E11D2A" /> {bi.hours}</div>
          <div><Icon name="phone" size={14} color="#E11D2A" /> {bi.phone}</div>
          <div><Icon name="mail" size={14} color="#E11D2A" /> {bi.email}</div>
        </div>
      </div>
      <FloatingWA wa={bi.whatsapp} biName={bi.name} />
    </div>
  );
}

function AdminScreen({ ctx }) {
  const { vehicles, goto, adminUser, businessInfo,
          saveVehicle, removeVehicle, toggleAvailability, saveBusiness } = ctx;
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editingBusiness, setEditingBusiness] = useState(false);

  const tryLogin = async () => {
    setError(""); setLoading(true);
    try { await signIn(email, pwd); }
    catch (e) { setError(e.message || "Error de login"); }
    finally { setLoading(false); }
  };

  if (!adminUser) {
    return (
      <div className="admin-login">
        <button className="icon-btn solid login-back" onClick={() => goto({ name: "home" })}><Icon name="back" size={18} color="#fff" /></button>
        <div className="al-card">
          <div className="al-icon"><Icon name="lock" size={32} color="#fff" /></div>
          <h2>PANEL ADMIN</h2>
          <p>Ingresa tus credenciales para gestionar el catálogo</p>
          <input type="email" value={email} placeholder="Email" onChange={e => setEmail(e.target.value)} autoFocus />
          <input type="password" value={pwd} placeholder="Contraseña" onChange={e => setPwd(e.target.value)}
            onKeyDown={e => e.key === "Enter" && tryLogin()} />
          {error && <div className="al-error">{error}</div>}
          <button className="btn primary block big" onClick={tryLogin} disabled={loading || !email || !pwd}>
            {loading ? "INGRESANDO…" : "INGRESAR"}
          </button>
        </div>
      </div>
    );
  }

  if (editingBusiness) {
    return <BusinessEditor
      info={businessInfo}
      onClose={() => setEditingBusiness(false)}
      onSave={async (data) => { await saveBusiness(data); setEditingBusiness(false); }}
    />;
  }

  if (editing) {
    return <VehicleEditor
      vehicle={editing === "new" ? null : editing}
      onClose={() => setEditing(null)}
      onSave={async (data) => {
        await saveVehicle({ ...(editing === "new" ? {} : editing), ...data });
        setEditing(null);
      }}
      onDelete={editing !== "new" ? async () => {
        if (confirm(`¿Eliminar ${editing.name}?`)) {
          await removeVehicle(editing.id);
          setEditing(null);
        }
      } : null}
    />;
  }

  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.available).length,
    rented: vehicles.filter(v => !v.available).length,
    revenue: vehicles.reduce((sum, v) => sum + v.pricePerDay, 0)
  };

  return (
    <div className="admin">
      <div className="admin-top">
        <button className="icon-btn solid" onClick={() => goto({ name: "home" })}><Icon name="back" size={18} color="#fff" /></button>
        <div className="rent-title"><small>PANEL</small><strong>ADMIN</strong></div>
        <button className="icon-btn ghost" onClick={async () => { await signOut(); goto({ name: "home" }); }} title="Cerrar sesión">
          <Icon name="lock" size={18} color="#fff" />
        </button>
      </div>

      <div className="admin-stats">
        <div className="as-card"><small>TOTAL</small><strong>{stats.total}</strong></div>
        <div className="as-card green"><small>DISPONIBLES</small><strong>{stats.available}</strong></div>
        <div className="as-card red"><small>EN RENTA</small><strong>{stats.rented}</strong></div>
        <div className="as-card"><small>FLOTA $/DÍA</small><strong>{fmtMoney(stats.revenue)}</strong></div>
      </div>

      <div className="admin-section">
        <div className="as-head">
          <h3>CONFIGURACIÓN</h3>
        </div>
        <button className="btn ghost-light block" onClick={() => setEditingBusiness(true)}>
          <Icon name="settings" size={16} /> EDITAR INFORMACIÓN DEL NEGOCIO
        </button>
      </div>

      <div className="admin-section">
        <div className="as-head">
          <h3>CATÁLOGO ({vehicles.length})</h3>
          <button className="btn primary small" onClick={() => setEditing("new")}>
            <Icon name="plus" size={14} color="#fff" /> NUEVO
          </button>
        </div>
        <div className="admin-list">
          {vehicles.map(v => (
            <div key={v.id} className="admin-row">
              <div className="ar-img" style={{ backgroundImage: `url(${v.images[0]})` }} />
              <div className="ar-info">
                <strong>{v.name}</strong>
                <small>{v.category} · {fmtMoney(v.pricePerDay)}/día</small>
                <div className="ar-tags">
                  <span className={`tag ${v.available ? "green" : "red"}`}>{v.available ? "DISPONIBLE" : "RENTADO"}</span>
                  {v.featured && <span className="tag yellow">DESTACADO</span>}
                </div>
              </div>
              <div className="ar-actions">
                <button className="icon-btn alt" onClick={() => toggleAvailability(v.id)} title={v.available ? "Marcar rentado" : "Marcar disponible"}>
                  <div className={`mini-switch ${v.available ? "on" : ""}`}><span /></div>
                </button>
                <button className="icon-btn alt" onClick={() => setEditing(v)}><Icon name="edit" size={16} /></button>
              </div>
            </div>
          ))}
          {vehicles.length === 0 && (
            <div className="empty">Catálogo vacío. Click en NUEVO para añadir el primer vehículo.</div>
          )}
        </div>
      </div>

      <div className="admin-foot">
        <small style={{ color: "var(--gray)" }}>Sesión: {adminUser?.email}</small>
      </div>
    </div>
  );
}

function BusinessEditor({ info, onClose, onSave }) {
  const [f, setF] = useState({ ...info });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const u = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = f.name && f.whatsapp && f.phone;

  const submit = async () => {
    if (!valid) return;
    setSaving(true); setError("");
    try { await onSave(f); }
    catch (e) { setError(e.message || "Error guardando"); }
    finally { setSaving(false); }
  };

  return (
    <div className="editor">
      <div className="admin-top">
        <button className="icon-btn solid" onClick={onClose}><Icon name="close" size={18} color="#fff" /></button>
        <div className="rent-title"><small>EDITAR</small><strong>INFO NEGOCIO</strong></div>
        <div style={{ width: 36 }} />
      </div>

      <div className="editor-body">
        <h4>Identidad</h4>
        <Field label="Nombre del negocio *">
          <input value={f.name} onChange={e => u("name", e.target.value)} placeholder="Ej. Domi Rent Car" />
        </Field>
        <Field label="Tagline / Lema">
          <input value={f.tagline} onChange={e => u("tagline", e.target.value)} placeholder="Frase corta de marca" />
        </Field>

        <h4>Contacto</h4>
        <Field label="Teléfono *">
          <input value={f.phone} onChange={e => u("phone", e.target.value)} placeholder="+1 (809) 000-0000" />
        </Field>
        <Field label="WhatsApp (solo dígitos, con código de país) *">
          <input
            value={f.whatsapp}
            onChange={e => u("whatsapp", e.target.value.replace(/[^\d]/g, ""))}
            placeholder="18095550199"
          />
          <small style={{ color: "var(--gray)", marginTop: 4, display: "block" }}>
            Sin "+" ni espacios. Ej: 18095550199
          </small>
        </Field>
        <Field label="Email">
          <input type="email" value={f.email} onChange={e => u("email", e.target.value)} placeholder="info@negocio.com" />
        </Field>
        <Field label="Instagram">
          <input value={f.instagram} onChange={e => u("instagram", e.target.value)} placeholder="@negocio" />
        </Field>

        <h4>Ubicación</h4>
        <Field label="Dirección">
          <input value={f.address} onChange={e => u("address", e.target.value)} placeholder="Av. ..., ciudad" />
        </Field>
        <Field label="Horario">
          <input value={f.hours} onChange={e => u("hours", e.target.value)} placeholder="Lun–Sab 8AM–8PM · Dom 9AM–5PM" />
        </Field>

        <h4>Estadísticas (mostradas en home/about)</h4>
        <div className="grid-2">
          <Field label="Años en el negocio">
            <input type="number" min="0" value={f.yearsInBusiness}
              onChange={e => u("yearsInBusiness", +e.target.value)} />
          </Field>
          <Field label="Rating (★)">
            <input type="number" step="0.1" min="0" max="5" value={f.rating}
              onChange={e => u("rating", +e.target.value)} />
          </Field>
        </div>
        <Field label="Clientes felices">
          <input type="number" min="0" value={f.happyClients}
            onChange={e => u("happyClients", +e.target.value)} />
        </Field>
        <small style={{ color: "var(--gray)", display: "block", marginTop: -8 }}>
          El número de "vehículos" en home se calcula automáticamente del catálogo.
        </small>

        {error && <div className="al-error" style={{ marginTop: 12 }}>{error}</div>}
      </div>

      <div className="sticky-bar">
        <button className="btn ghost-light" onClick={onClose}>CANCELAR</button>
        <button className="btn primary block" disabled={!valid || saving} onClick={submit}>
          <Icon name="check" size={16} /> {saving ? "GUARDANDO…" : "GUARDAR"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="field"><small>{label}</small>{children}</label>;
}

function ExtraToggle({ on, onChange, title, sub }) {
  return (
    <button type="button" className={`extra-toggle ${on ? "on" : ""}`} onClick={() => onChange(!on)}>
      <div>
        <strong>{title}</strong>
        <small>{sub}</small>
      </div>
      <div className={`switch ${on ? "on" : ""}`}><span /></div>
    </button>
  );
}

function VehicleEditor({ vehicle, onClose, onSave, onDelete }) {
  const isNew = !vehicle;
  const [f, setF] = useState(() => vehicle ? { ...vehicle } : {
    name: "", category: "SEDÁN", year: 2024, pricePerDay: 75,
    transmission: "Automática", fuel: "Gasolina", seats: 5, doors: 4,
    luggage: 3, ac: true, bluetooth: true, gps: false,
    power: "", engine: "", color: "", plate: "",
    available: true, featured: false, description: "",
    images: []
  });
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const u = (k, v) => setF(p => ({ ...p, [k]: v }));
  const removeImg = (i) => setF(p => ({ ...p, images: p.images.filter((_, ix) => ix !== i) }));

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingIdx(f.images.length);
    setError("");
    try {
      const url = await uploadVehicleImage(file, f.id || 'tmp');
      setF(p => ({ ...p, images: [...p.images, url] }));
    } catch (err) {
      setError(err.message || "Error subiendo imagen");
    } finally {
      setUploadingIdx(null);
    }
  };

  const valid = f.name && f.category && f.pricePerDay > 0 && f.images.length > 0;

  const submit = async () => {
    if (!valid) return;
    setSaving(true); setError("");
    try { await onSave(f); }
    catch (e) { setError(e.message || "Error guardando"); }
    finally { setSaving(false); }
  };

  return (
    <div className="editor">
      <div className="admin-top">
        <button className="icon-btn solid" onClick={onClose}><Icon name="close" size={18} color="#fff" /></button>
        <div className="rent-title"><small>{isNew ? "NUEVO" : "EDITAR"}</small><strong>VEHÍCULO</strong></div>
        {!isNew && onDelete && (
          <button className="icon-btn red" onClick={onDelete}><Icon name="trash" size={16} color="#fff" /></button>
        )}
        {isNew && <div style={{ width: 36 }} />}
      </div>

      <div className="editor-body">
        <h4>Imágenes ({f.images.length})</h4>
        <div className="img-list">
          {f.images.map((src, i) => (
            <div key={i} className="img-row">
              <div className="ir-preview" style={{ backgroundImage: `url(${src})` }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <small style={{ color: "var(--gray)", wordBreak: "break-all", display: "block" }}>
                  {src.length > 60 ? "…" + src.slice(-60) : src}
                </small>
              </div>
              <button className="icon-btn alt" onClick={() => removeImg(i)}><Icon name="trash" size={14} /></button>
            </div>
          ))}
          {uploadingIdx !== null && (
            <div className="img-row">
              <div className="ir-preview" />
              <small>Subiendo…</small>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onPickFile}
          />
          <button className="btn ghost-dark small block"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingIdx !== null}>
            <Icon name="upload" size={14} /> {uploadingIdx !== null ? "SUBIENDO…" : "SUBIR FOTO"}
          </button>
        </div>

        <h4>Información básica</h4>
        <Field label="Nombre *"><input value={f.name} onChange={e => u("name", e.target.value)} placeholder="Ej. Toyota Corolla 2024" /></Field>
        <div className="grid-2">
          <Field label="Categoría *">
            <select value={f.category} onChange={e => u("category", e.target.value)}>
              <option>SEDÁN</option><option>SUV PREMIUM</option><option>SUV LUJO</option>
              <option>SUV FAMILIAR</option><option>SUV COMPACTA</option>
              <option>DEPORTIVO</option><option>CONVERTIBLE</option><option>PICKUP</option>
              <option>VAN</option><option>ECONÓMICO</option>
            </select>
          </Field>
          <Field label="Año"><input type="number" value={f.year} onChange={e => u("year", +e.target.value)} /></Field>
        </div>
        <div className="grid-2">
          <Field label="Color"><input value={f.color} onChange={e => u("color", e.target.value)} /></Field>
          <Field label="Placa"><input value={f.plate} onChange={e => u("plate", e.target.value)} /></Field>
        </div>
        <Field label="Precio por día (USD) *"><input type="number" value={f.pricePerDay} onChange={e => u("pricePerDay", +e.target.value)} /></Field>

        <h4>Especificaciones</h4>
        <div className="grid-2">
          <Field label="Transmisión">
            <select value={f.transmission} onChange={e => u("transmission", e.target.value)}>
              <option>Automática</option><option>Manual</option>
            </select>
          </Field>
          <Field label="Combustible">
            <select value={f.fuel} onChange={e => u("fuel", e.target.value)}>
              <option>Gasolina</option><option>Diésel</option><option>Híbrido</option><option>Eléctrico</option>
            </select>
          </Field>
        </div>
        <div className="grid-3">
          <Field label="Asientos"><input type="number" value={f.seats} onChange={e => u("seats", +e.target.value)} /></Field>
          <Field label="Puertas"><input type="number" value={f.doors} onChange={e => u("doors", +e.target.value)} /></Field>
          <Field label="Maletas"><input type="number" value={f.luggage} onChange={e => u("luggage", +e.target.value)} /></Field>
        </div>
        <div className="grid-2">
          <Field label="Potencia"><input value={f.power} placeholder="Ej. 180 HP" onChange={e => u("power", e.target.value)} /></Field>
          <Field label="Motor"><input value={f.engine} placeholder="Ej. 2.0L Turbo" onChange={e => u("engine", e.target.value)} /></Field>
        </div>

        <h4>Equipamiento</h4>
        <ExtraToggle on={f.ac} onChange={v => u("ac", v)} title="Aire acondicionado" sub="Climatización" />
        <ExtraToggle on={f.bluetooth} onChange={v => u("bluetooth", v)} title="Bluetooth" sub="Sistema de audio" />
        <ExtraToggle on={f.gps} onChange={v => u("gps", v)} title="GPS Navegación" sub="Incluido" />

        <h4>Estado</h4>
        <ExtraToggle on={f.available} onChange={v => u("available", v)} title="Disponible" sub={f.available ? "Visible para rentar" : "Oculto / en renta"} />
        <ExtraToggle on={f.featured} onChange={v => u("featured", v)} title="Destacado" sub="Aparece en sección destacados" />

        <h4>Descripción</h4>
        <Field label="Texto de marketing">
          <textarea rows={4} value={f.description} onChange={e => u("description", e.target.value)} placeholder="Descripción del vehículo..." />
        </Field>

        {error && <div className="al-error" style={{ marginTop: 12 }}>{error}</div>}
      </div>

      <div className="sticky-bar">
        <button className="btn ghost-light" onClick={onClose}>CANCELAR</button>
        <button className="btn primary block" disabled={!valid || saving} onClick={submit}>
          <Icon name="check" size={16} /> {saving ? "GUARDANDO…" : (isNew ? "CREAR" : "GUARDAR")}
        </button>
      </div>
    </div>
  );
}

export default App;
