const REFERENCE_LENGTH = 10;
const HEX_TAIL = /[0-9a-f]{10}$/iu;

/**
 * The short code a patient quotes for a visit. Server ids end in random hex,
 * so their tail already reads as a code. Readable ids, like the seeded demo
 * visits, are hashed instead of showing a slice of the words they are made of.
 */
export function formatAppointmentReference(appointmentId: string) {
  if (HEX_TAIL.test(appointmentId)) {
    return appointmentId.slice(-REFERENCE_LENGTH).toUpperCase();
  }

  // Two FNV-1a passes with different seeds give 16 hex digits to cut from.
  const code = fnv1a(appointmentId, 0x811c9dc5) + fnv1a(appointmentId, 0x01000193);

  return code.slice(0, REFERENCE_LENGTH).toUpperCase();
}

function fnv1a(value: string, seed: number) {
  let hash = seed;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}
