import type { User } from 'firebase/auth';

const AUTH_EMULATOR_ORIGIN = 'http://127.0.0.1:9099';

// Emulator accepts the `owner` bearer token for admin account updates.
export async function markEmailVerified(user: User, projectId: string) {
  const response = await fetch(
    `${AUTH_EMULATOR_ORIGIN}/identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:update`,
    {
      body: JSON.stringify({ emailVerified: true, localId: user.uid }),
      headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw new Error(`Auth emulator update failed with ${response.status}.`);
  }

  await user.reload();
  await user.getIdToken(true);
}
