import {
  ActorSchema,
  AuditEventSchema,
  type Actor,
  type AuditAction,
  type AuditEvent,
} from "./schemas";

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase("en-GB")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
}

export interface CreateAuditEventInput {
  episodeId: string;
  action: AuditAction;
  entityType: AuditEvent["entityType"];
  entityId: string;
  actor: Actor;
  occurredAt: string;
  details?: Readonly<Record<string, string>>;
  id?: string;
  existingEvents?: readonly AuditEvent[];
}

function buildAuditEventBaseId(input: CreateAuditEventInput): string {
  const timestampSlug = input.occurredAt.replace(/[^0-9]/gu, "");
  return `audit-${slugify(input.action)}-${slugify(input.entityId)}-${timestampSlug}`;
}

/**
 * Returns the next stable event id for a particular event identity.
 *
 * ISO milliseconds are retained in the base id. When two events still occur
 * in the same millisecond, a deterministic occurrence suffix is derived from
 * the already-persisted episode history rather than randomness or wall-clock
 * retries.
 */
export function createAuditEventId(
  input: CreateAuditEventInput,
  existingEvents: readonly AuditEvent[] = input.existingEvents ?? [],
): string {
  const baseId = buildAuditEventBaseId(input);
  const existingIds = new Set(existingEvents.map((event) => event.id));
  if (!existingIds.has(baseId)) {
    return baseId;
  }

  let occurrence = 2;
  while (existingIds.has(`${baseId}-${occurrence}`)) {
    occurrence += 1;
  }
  return `${baseId}-${occurrence}`;
}

export function createAuditEvent(input: CreateAuditEventInput): AuditEvent {
  const actor = ActorSchema.parse(input.actor);
  const existingEvents = input.existingEvents ?? [];
  const id = input.id ?? createAuditEventId(input, existingEvents);
  if (existingEvents.some((event) => event.id === id)) {
    throw new Error(`Audit event ${id} already exists`);
  }

  return AuditEventSchema.parse({
    id,
    episodeId: input.episodeId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    actor,
    occurredAt: input.occurredAt,
    details: Object.entries(input.details ?? {})
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => ({ key, value })),
  });
}

export function appendAuditEvent(
  existing: readonly AuditEvent[],
  event: AuditEvent,
): AuditEvent[] {
  if (existing.some((candidate) => candidate.id === event.id)) {
    throw new Error(`Audit event ${event.id} already exists`);
  }
  return [...existing, AuditEventSchema.parse(event)];
}
