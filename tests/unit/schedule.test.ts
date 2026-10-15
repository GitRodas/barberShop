import { describe, expect, it } from "vitest";
import {
  addMonths,
  daysInMonth,
  isoWeekday,
  localTime,
  localToDate,
  startOfWeek,
  toYmd,
} from "@/lib/time";
import { appointmentsLosingCoverage, isCovered, overlaps } from "@/lib/admin/schedule";

const interval = (weekday: number, start: string, end: string, isActive = true) => ({
  weekday,
  start_time: `${start}:00`,
  end_time: `${end}:00`,
  is_active: isActive,
});

// Lunes 19 de octubre de 2026, 10:00–11:00 hora de Bogotá.
const appointment = {
  starts_at: localToDate("2026-10-19", "10:00").toISOString(),
  ends_at: localToDate("2026-10-19", "11:00").toISOString(),
};

describe("fechas en America/Bogota", () => {
  it("convierte entre hora local y UTC", () => {
    expect(localToDate("2026-10-15", "09:00").toISOString()).toBe("2026-10-15T14:00:00.000Z");
    expect(toYmd("2026-10-16T04:30:00Z")).toBe("2026-10-15");
    expect(localTime("2026-10-16T04:30:00Z")).toBe("23:30");
  });

  it("calcula días de la semana, semanas y meses", () => {
    expect(isoWeekday("2026-10-18")).toBe(7);
    expect(isoWeekday("2026-10-19")).toBe(1);
    expect(startOfWeek("2026-10-18")).toBe("2026-10-12");
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-01");
    expect(daysInMonth("2028-02-10")).toBe(29);
  });
});

describe("cobertura de citas por horario", () => {
  it("exige que la cita quepa en un intervalo activo del mismo día", () => {
    expect(isCovered(appointment, [interval(1, "09:00", "12:00")])).toBe(true);
    expect(isCovered(appointment, [interval(1, "10:30", "12:00")])).toBe(false);
    expect(isCovered(appointment, [interval(2, "09:00", "12:00")])).toBe(false);
    expect(isCovered(appointment, [interval(1, "09:00", "12:00", false)])).toBe(false);
  });

  it("detecta citas afectadas al quitar un intervalo", () => {
    const current = [interval(1, "09:00", "12:00"), interval(1, "14:00", "18:00")];
    expect(appointmentsLosingCoverage([appointment], current, [current[1]])).toHaveLength(1);
    expect(appointmentsLosingCoverage([appointment], current, [current[0]])).toHaveLength(0);
  });

  it("detecta solapamiento con bloqueos (intervalos semiabiertos)", () => {
    expect(overlaps(appointment, localToDate("2026-10-19", "10:59"), localToDate("2026-10-19", "12:00"))).toBe(true);
    expect(overlaps(appointment, localToDate("2026-10-19", "11:00"), localToDate("2026-10-19", "12:00"))).toBe(false);
  });
});
