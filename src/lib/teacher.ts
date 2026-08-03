/**
 * Single source of truth for "may act as a teacher".
 *
 * Prefers a server-only TEACHER_IDS so the list can be kept out of the client bundle.
 * NEXT_PUBLIC_TEACHER_IDS stays as a fallback because the navbar is a client component
 * and can only read NEXT_PUBLIC_ vars at build time.
 *
 * When roles move into the database (Clerk publicMetadata / a roles table), this is the
 * only function that needs to change — every caller keeps working.
 */
export const isTeacher = (userId?: string | null) => {
  if (!userId) return false;

  const raw = process.env.TEACHER_IDS ?? process.env.NEXT_PUBLIC_TEACHER_IDS ?? "";

  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .includes(userId);
};
