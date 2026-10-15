# BarberShop

Aplicación web para una barbería unipersonal: reservas de cortes presenciales, panel administrativo e inventario.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Auth + PostgreSQL) · Zod · Lucide.

## Requisitos

- Node.js 20.9 o superior y npm.
- Un proyecto en [Supabase](https://supabase.com) (plan gratuito).

## Puesta en marcha local

```bash
npm install
cp .env.example .env.local   # completa los valores
npm run dev                  # http://localhost:3000
```

### Variables de entorno

| Variable | Dónde obtenerla |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys (clave *publishable*) |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio (`http://localhost:3000` en local) |

Nunca uses la clave `service_role`/*secret* en variables `NEXT_PUBLIC_*` ni la subas al repositorio.

## Supabase CLI

La CLI está instalada como dependencia de desarrollo (`npx supabase ...`).

```bash
npx supabase login                       # autenticación en el navegador
npx supabase link --project-ref <ref>    # ref: Project Settings → General
```

`supabase/config.toml` solo afecta al entorno local; la configuración de Auth del proyecto remoto se ajusta en el panel de Supabase.

## Scripts

| Comando | Acción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | Comprobación de TypeScript |

## Estructura

```
src/
  app/              Rutas (App Router)
  components/       Componentes de UI y layout
  config/           Configuración del sitio (nombre, zona horaria)
  lib/supabase/     Clientes de Supabase (navegador, servidor, proxy)
  proxy.ts          Refresco de sesión de Supabase en cada petición
```

> Las secciones de base de datos, migraciones, correo, administrador inicial y despliegue en Vercel se documentarán en las fases correspondientes.
