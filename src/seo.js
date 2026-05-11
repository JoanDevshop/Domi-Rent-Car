// ============================================================
// SEO helpers — actualizan <title> y meta tags según la vista actual.
// Para SPA Vite: side-effects en document.head al cambiar de view.
// ============================================================

const fmtUSD = (n) => `US$${Number(n).toLocaleString('en-US')}`;

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const m = selector.match(/\[(name|property)="([^"]+)"\]/);
    if (m) el.setAttribute(m[1], m[2]);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function applySeo({ view, vehicles, businessInfo: bi }) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const businessName = (bi?.name || 'DOMI RENT CAR').toUpperCase();

  let title = `Inicio · ${businessName} — Renta de Vehículos en República Dominicana`;
  let description = bi?.heroSubtitle ||
    'Renta de vehículos premium en República Dominicana. Reserva por WhatsApp en minutos.';
  let ogImage = bi?.heroImageUrl || '/assets/logo.png';
  let canonical = baseUrl + '/';

  // Por vista
  if (view?.name === 'vehicle') {
    const v = (vehicles || []).find(x => x.id === view.id);
    if (v) {
      title = `${v.name} · ${fmtUSD(v.pricePerDay)}/día · ${businessName}`;
      description = v.description
        ? `${v.description.slice(0, 155)}${v.description.length > 155 ? '…' : ''}`
        : `Renta el ${v.name} (${v.year}) por ${fmtUSD(v.pricePerDay)}/día. ${v.category}, ${v.transmission}, ${v.seats} asientos. ${businessName}.`;
      if (v.images?.[0]) ogImage = v.images[0];
    }
  } else if (view?.name === 'about') {
    title = `Sobre Nosotros · ${businessName}`;
    description = bi?.aboutSubtitle ||
      'Conoce nuestra historia. Tu socio de confianza en renta de vehículos en República Dominicana.';
  } else if (view?.name === 'admin') {
    title = `Admin · ${businessName}`;
    description = 'Panel administrativo.';
  } else {
    title = `Inicio · ${businessName} — Renta de Vehículos en República Dominicana`;
  }

  // <title>
  document.title = title;

  // Meta tags
  setMeta('meta[name="description"]', 'content', description);
  setMeta('meta[property="og:title"]', 'content', title);
  setMeta('meta[property="og:description"]', 'content', description);
  setMeta('meta[property="og:image"]', 'content', ogImage.startsWith('http') ? ogImage : baseUrl + ogImage);
  setMeta('meta[property="og:url"]', 'content', canonical);
  setMeta('meta[property="og:site_name"]', 'content', businessName);
  setMeta('meta[name="twitter:title"]', 'content', title);
  setMeta('meta[name="twitter:description"]', 'content', description);
  setMeta('meta[name="twitter:image"]', 'content', ogImage.startsWith('http') ? ogImage : baseUrl + ogImage);

  setLink('canonical', canonical);

  // Robots: noindex en admin
  setMeta('meta[name="robots"]', 'content',
    view?.name === 'admin' ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');

  // JSON-LD dinámico — actualiza el del business + agrega Vehicle si aplica
  applyJsonLd({ view, vehicles, bi, baseUrl });
}

function applyJsonLd({ view, vehicles, bi, baseUrl }) {
  // Update business JSON-LD with actual bi values
  const businessLd = {
    "@context": "https://schema.org",
    "@type": "AutoRental",
    "name": bi?.name || "DOMI RENT CAR",
    "description": bi?.aboutSubtitle || bi?.tagline || "Renta de vehículos premium en República Dominicana.",
    "url": baseUrl + '/',
    "telephone": bi?.phone || "",
    "email": bi?.email || "",
    "image": bi?.heroImageUrl || '/assets/logo.png',
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": bi?.address || "",
      "addressCountry": "DO"
    },
    "areaServed": [
      { "@type": "Country", "name": "República Dominicana" },
      { "@type": "City", "name": "Santo Domingo" },
      { "@type": "City", "name": "Punta Cana" }
    ],
    "aggregateRating": bi?.rating ? {
      "@type": "AggregateRating",
      "ratingValue": String(bi.rating),
      "bestRating": "5",
      "reviewCount": String(bi?.happyClients || 100)
    } : undefined,
  };
  replaceLd('ld-business', businessLd);

  // Vehicle JSON-LD — solo cuando estamos en detalle
  if (view?.name === 'vehicle') {
    const v = (vehicles || []).find(x => x.id === view.id);
    if (v) {
      const vehicleLd = {
        "@context": "https://schema.org",
        "@type": "Car",
        "name": v.name,
        "description": v.description || `${v.name} ${v.year} en ${bi?.name || 'Domi Rent Car'}`,
        "image": v.images?.[0] || '/assets/logo.png',
        "brand": { "@type": "Brand", "name": (v.name || '').split(' ')[0] || 'Auto' },
        "model": v.name,
        "vehicleModelDate": String(v.year || ''),
        "fuelType": v.fuel || 'Gasoline',
        "numberOfDoors": v.doors || 4,
        "vehicleSeatingCapacity": v.seats || 5,
        "vehicleTransmission": v.transmission || 'Automatic',
        "offers": {
          "@type": "Offer",
          "price": String(v.pricePerDay || 0),
          "priceCurrency": "USD",
          "availability": v.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "url": baseUrl + '/',
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": String(v.pricePerDay || 0),
            "priceCurrency": "USD",
            "unitCode": "DAY"
          }
        }
      };
      replaceLd('ld-vehicle', vehicleLd);
    }
  } else {
    // Quitar el vehicle LD si no estamos en detalle
    const old = document.getElementById('ld-vehicle');
    if (old) old.remove();
  }
}

function replaceLd(id, data) {
  const json = JSON.stringify(data, (_k, v) => v === undefined ? undefined : v);
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = json;
}
