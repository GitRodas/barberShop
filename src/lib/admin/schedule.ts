import { isoWeekday, localTime, toYmd } from "@/lib/time";

type Interval = { weekday: number; start_time: string; end_time: string; is_active: boolean };
type Appointment = { starts_at: string; ends_at: string };

function localEnd(endsAt: string): string {
  const time = localTime(endsAt);
  return time === "00:00" ? "24:00" : time;
}

/** ¿La cita cabe completa dentro de algún intervalo laboral activo? */
export function isCovered(appointment: Appointment, intervals: Interval[]): boolean {
  const weekday = isoWeekday(toYmd(appointment.starts_at));
  const start = localTime(appointment.starts_at);
  const end = localEnd(appointment.ends_at);
  return intervals.some(
    (interval) =>
      interval.is_active &&
      interval.weekday === weekday &&
      interval.start_time.slice(0, 5) <= start &&
      end <= interval.end_time.slice(0, 5),
  );
}

/** Citas que hoy están dentro del horario y dejarían de estarlo con el nuevo conjunto de intervalos. */
export function appointmentsLosingCoverage<T extends Appointment>(
  appointments: T[],
  current: Interval[],
  proposed: Interval[],
): T[] {
  return appointments.filter(
    (appointment) => isCovered(appointment, current) && !isCovered(appointment, proposed),
  );
}

export function overlaps(appointment: Appointment, start: Date, end: Date): boolean {
  return new Date(appointment.starts_at) < end && new Date(appointment.ends_at) > start;
}
