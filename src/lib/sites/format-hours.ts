const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type GoogleHoursPeriod = {
  open?: { day?: number; hour?: number; minute?: number };
  close?: { day?: number; hour?: number; minute?: number };
};

type GoogleHours = {
  weekdayDescriptions?: string[];
  periods?: GoogleHoursPeriod[];
  openNow?: boolean;
};

type FormattedHoursEntry = {
  label: string;
  value: string;
};

export function formatSiteHours(hoursJson: unknown): FormattedHoursEntry[] {
  if (!hoursJson || typeof hoursJson !== "object") {
    return [];
  }

  const hours = hoursJson as GoogleHours & Record<string, unknown>;

  if (Array.isArray(hours.weekdayDescriptions) && hours.weekdayDescriptions.length > 0) {
    return hours.weekdayDescriptions.map((description, index) => {
      const [label, ...rest] = String(description).split(":");
      return {
        label: label?.trim() || `Day ${index + 1}`,
        value: rest.join(":").trim() || String(description),
      };
    });
  }

  if (Array.isArray(hours.periods) && hours.periods.length > 0) {
    const grouped = new Map<number, string[]>();

    for (const period of hours.periods) {
      const day = period.open?.day;
      if (day === undefined) {
        continue;
      }

      const open = formatTime(period.open?.hour, period.open?.minute);
      const close = formatTime(period.close?.hour, period.close?.minute);
      const value = close ? `${open} – ${close}` : open;
      const existing = grouped.get(day) ?? [];
      existing.push(value);
      grouped.set(day, existing);
    }

    return DAY_NAMES.map((dayName, dayIndex) => {
      const value = grouped.get(dayIndex)?.join(", ");
      return value ? { label: dayName, value } : null;
    }).filter((entry): entry is FormattedHoursEntry => entry !== null);
  }

  if (typeof hours.summary === "string" && hours.summary.trim()) {
    return [{ label: "Hours", value: hours.summary.trim() }];
  }

  const simpleEntries = Object.entries(hours).filter(
    ([key, value]) =>
      typeof value === "string" &&
      value.trim() &&
      !["openNow"].includes(key),
  );

  if (simpleEntries.length > 0) {
    return simpleEntries.map(([label, value]) => ({
      label: label.replaceAll("_", " "),
      value: String(value),
    }));
  }

  return [];
}

function formatTime(hour?: number, minute?: number): string {
  if (hour === undefined) {
    return "";
  }

  const minutes = minute ?? 0;
  const period = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 === 0 ? 12 : hour % 12;

  return `${normalizedHour}:${String(minutes).padStart(2, "0")} ${period}`;
}
