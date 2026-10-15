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

## Autenticación (Supabase Auth)

Configura en el panel de Supabase:

1. **Authentication → URL Configuration**
   - *Site URL*: `http://localhost:3000` (en producción, la URL de Vercel).
   - *Redirect URLs*: `http://localhost:3000/**` y la URL de producción con `/**`.
2. **Authentication → Sign In / Providers → Email**: confirmación de correo activada y longitud mínima de contraseña 8.
3. **Authentication → Email Templates** (opcional). Con las plantillas por defecto, `/auth/confirm` recibe un `code` y el enlace debe abrirse en el mismo navegador donde se hizo el registro o la solicitud. Para que funcione desde cualquier dispositivo, cambia el enlace de las plantillas por:
   - *Confirm signup*: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/reservar`
   - *Reset password*: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/restablecer-password`
4. **SMTP propio (recomendado en producción)**: el correo integrado de Supabase tiene un límite de envío muy bajo. Configura un proveedor (p. ej. Resend o Brevo) en *Authentication → Emails → SMTP Settings*.

Flujo: el registro guarda nombre y teléfono en los metadatos y un trigger crea el perfil con rol `client`. `/auth/confirm` valida el enlace del correo (`token_hash` o `code`) y redirige solo a rutas internas. El proxy refresca la sesión y redirige de forma optimista; cada página protegida vuelve a verificar la sesión en el servidor y RLS protege los datos.

## Panel del barbero (`/admin`)

- **Resumen**: agenda del día, pendientes por confirmar, existencias bajas y avisos de citas afectadas.
- **Citas**: vistas de día, semana y mes; confirmar, completar (cuando la cita ya empezó) y cancelar.
- **Horarios**: varios intervalos por día (los huecos son descansos) y bloqueos. Antes de quitar un intervalo o crear un bloqueo se listan las citas activas afectadas y se pide confirmación; las citas no se cancelan solas.
- **Configuración**: duración del corte (1 hora por defecto), antelación mínima para reservar y cancelar, días visibles y citas activas por cliente.

## Base de datos

Migraciones versionadas en `supabase/migrations/`:

| Archivo | Contenido |
| --- | --- |
| `…01_schema.sql` | Tablas, tipos, restricciones (sin solapamientos de citas ni de horarios), índices y vista de existencias bajas |
| `…02_security.sql` | Privilegios mínimos, RLS en todas las tablas y funciones de negocio |
| `…03_slot_60_minutes.sql` | Duración de cada corte: 1 hora |

```bash
npx supabase db push --dry-run   # revisar qué se aplicará
npx supabase db push             # aplicar al proyecto vinculado
npm run db:types                 # regenerar src/lib/supabase/database.types.ts
npm run db:check                 # comprobaciones de seguridad (ver abajo)
```

### Modelo de seguridad

- RLS activo en todas las tablas. Los clientes solo leen su perfil y sus citas; el administrador lo ve todo.
- Las citas y las existencias **no** se escriben directamente: se usan funciones (`book_appointment`, `cancel_appointment`, `set_appointment_status`, `register_inventory_movement`) que validan identidad, permisos y datos dentro de una transacción.
- `appointments_no_overlap` (restricción de exclusión) impide solapamientos aunque haya reservas concurrentes.
- El rol no se puede cambiar desde la API (sin permiso de columna y con un trigger de protección). Solo puede existir un administrador.
- El historial de inventario es inmutable y las cantidades nunca pueden ser negativas.
- Las funciones privilegiadas usan `security definer` con `search_path` vacío y `execute` solo para `authenticated`.

### Comprobaciones

`supabase/checks/security_checks.sql` crea usuarios y datos de prueba, verifica RLS, reservas (fuera de horario, descansos, bloqueos, solapamientos, límite por cliente), cancelaciones, estados e inventario, y **termina siempre con una excepción** para que no persista nada. Resultado esperado: `CHECKS_PASSED: 23`.

### Administrador inicial

Nunca se asigna desde el registro público. Tras registrarte y confirmar el correo con la cuenta del barbero, ejecuta en **Supabase → SQL Editor**:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'correo-del-barbero@ejemplo.com');
```

Solo puede existir un administrador; para cambiarlo, primero devuelve el anterior a `client`.

## Scripts

| Comando | Acción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | Comprobación de TypeScript |
| `npm test` | Pruebas unitarias (Vitest) |

## Estructura

```
src/
  app/              Rutas (App Router)
  components/       Componentes de UI y layout
  config/           Configuración del sitio (nombre, zona horaria)
  lib/supabase/     Clientes de Supabase (navegador, servidor, proxy)
  lib/auth/         Sesión, acciones de servidor y redirecciones seguras
  lib/validation/   Esquemas Zod
  proxy.ts          Refresco de sesión y redirecciones optimistas
```

> Las secciones de base de datos, migraciones, correo, administrador inicial y despliegue en Vercel se documentarán en las fases correspondientes.
