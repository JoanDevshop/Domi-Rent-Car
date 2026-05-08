# Domi Rent Car

Catálogo web de alquiler de vehículos. Cliente externo, repo separado.

## Stack
- Vite 8 + React 19
- localStorage para persistencia (v1, sin backend)
- WhatsApp como canal principal de conversión

## Setup

```bash
npm install
cp .env.example .env.local   # ajusta VITE_ADMIN_PASSWORD
npm run dev
```

Por defecto sirve en `http://localhost:5173` (o el siguiente disponible).

## Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_ADMIN_PASSWORD` | Contraseña del panel admin. Demo: `admin123` |

## Estructura

```
src/
├── App.jsx        # Pantallas: home, vehículo, renta, confirmación, admin, about
├── IOSDevice.jsx  # Frame iOS para preview en desktop
├── data.js        # Catálogo inicial + datos del negocio
├── styles.css     # Tema racing flag (negro / rojo / blanco)
└── main.jsx       # Entry
```

## Persistencia

- El catálogo inicial vive en `src/data.js`.
- Las ediciones del admin se guardan en `localStorage` del navegador (key `domi_rent_vehicles_v1`).
- "RESTABLECER CATÁLOGO" en el panel admin restaura los defaults.

**Importante:** sin backend, cada navegador tiene su propia copia del catálogo. Cuando el cliente edite, los cambios solo se ven desde su mismo dispositivo. Para multi-dispositivo migrar a Supabase (decisión pendiente).

## Build

```bash
npm run build      # genera dist/
npm run preview    # sirve dist/ localmente
```

## Despliegue

Pendiente. Probables: Cloudflare Pages, Netlify, o Vercel separado.
