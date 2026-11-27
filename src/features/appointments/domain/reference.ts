const REFERENCE_LENGTH = 10;
const HEX_TAIL = /[0-9a-f]{10}$/iu;

// Hash readable IDs (such as demo fixtures) instead of slicing raw words.
export function formatAppointmentReference(appointmentId: string) {
  if (HEX_TAIL.test(appointmentId)) {
    return appointmentId.slice(-REFERENCE_LENGTH).toUpperCase();
  }

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
