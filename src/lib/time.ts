import { siteConfig } from "@/config/site";

// Colombia no aplica horario de verano: America/Bogota es siempre UTC-05:00.
const OFFSET = "-05:00";
const OFFSET_MS = -5 * 60 * 60 * 1000;
const { timeZone, locale } = siteConfig;

export type Ymd = string; // YYYY-MM-DD en hora local de Bogotá

export const WEEKDAYS = [
  { value: 1, label: "Lunes", short: "Lun" },
  { value: 2, label: "Martes", short: "Mar" },
  { value: 3, label: "Miércoles", short: "Mié" },
  { value: 4, label: "Jueves", short: "Jue" },
  { value: 5, label: "Viernes", short: "Vie" },
  { value: 6, label: "Sábado", short: "Sáb" },
  { value: 7, label: "Domingo", short: "Dom" },
] as const;

export function isYmd(value: unknown): value is Ymd {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  );
}

export function todayYmd(now = new Date()): Ymd {
  return toYmd(now);
}

export function toYmd(date: Date | string): Ymd {
  const local = new Date(new Date(date).getTime() + OFFSET_MS);
  return local.toISOString().slice(0, 10);
}

/** Instante UTC correspondiente a una fecha y hora locales de Bogotá. */
export function localToDate(ymd: Ymd, time = "00:00"): Date {
  return new Date(`${ymd}T${time.slice(0, 5)}:00${OFFSET}`);
}

export function addDays(ymd: Ymd, days: number): Ymd {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** 1 = lunes … 7 = domingo. */
export function isoWeekday(ymd: Ymd): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return ((new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7) + 1;
}

export function startOfWeek(ymd: Ymd): Ymd {
  return addDays(ymd, 1 - isoWeekday(ymd));
}

export function startOfMonth(ymd: Ymd): Ymd {
  return `${ymd.slice(0, 7)}-01`;
}

export function addMonths(ymd: Ymd, months: number): Ymd {
  const [y, m] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + months, 1)).toISOString().slice(0, 10);
}

export function daysInMonth(ymd: Ymd): number {
  const [y, m] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Hora local "HH:MM" de un instante. */
export function localTime(date: Date | string): string {
  return new Date(new Date(date).getTime() + OFFSET_MS).toISOString().slice(11, 16);
}

export function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

const timeFmt = new Intl.DateTimeFormat(locale, {
  timeZone,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatTime(date: Date | string): string {
  return timeFmt.format(new Date(date));
}

/** Formatea "HH:MM[:SS]" de la base de datos como hora legible. */
export function formatClock(time: string): string {
  if (time.startsWith("24:00")) return "12:00 a. m.";
  return formatTime(localToDate("2000-01-01", time));
}

export function formatDate(
  value: Ymd | Date | string,
  options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" },
): string {
  const date = typeof value === "string" && isYmd(value) ? localToDate(value, "12:00") : new Date(value);
  return new Intl.DateTimeFormat(locale, { timeZone, ...options }).format(date);
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date, { weekday: "short", day: "numeric", month: "short" })}, ${formatTime(date)}`;
}
