export function estimateRunOut(input: {
  quantity: number | null;
  dailyDose: number | null;
  startsOn: string | null;
  prn?: boolean;
}) {
  if (
    input.quantity == null ||
    input.dailyDose == null ||
    input.dailyDose <= 0 ||
    !input.startsOn ||
    input.prn
  ) {
    return {
      kind: "insufficient" as const,
      date: null,
      explanation: input.prn
        ? "PRN use varies, so SignalRx cannot predict an exact run-out date."
        : "Quantity, daily use, and start date are needed for an estimate.",
    };
  }
  const days = Math.ceil(input.quantity / input.dailyDose);
  const date = new Date(`${input.startsOn}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Math.max(0, days - 1));
  return {
    kind: "exact" as const,
    date: date.toISOString().slice(0, 10),
    explanation: `${input.quantity} units at ${input.dailyDose} per day.`,
  };
}

export function dueState(
  scheduledFor: string,
  now: string,
  event?: "taken" | "skipped" | "taken_late" | null,
) {
  if (event) return event;
  const due = new Date(scheduledFor).getTime();
  const current = new Date(now).getTime();
  if (current < due) return "upcoming";
  if (current - due <= 60 * 60 * 1000) return "due";
  return "overdue";
}

export function subtractWorkingDays(date: string, workingDays: number) {
  const result = new Date(`${date}T12:00:00Z`);
  let remaining = workingDays;
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() - 1);
    const weekday = result.getUTCDay();
    if (weekday !== 0 && weekday !== 6) remaining -= 1;
  }
  return result.toISOString().slice(0, 10);
}
