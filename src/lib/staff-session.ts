export const STAFF_SESSION_KEY = "tolong_staff_demo_session";

export type StaffSession = {
  staffId: string;
  loggedInAt: string;
  demo: true;
};

function parseSession(raw: string | null): StaffSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StaffSession>;
    if (typeof parsed.staffId === "string" && parsed.staffId.trim().length > 0) {
      return {
        staffId: parsed.staffId.trim(),
        loggedInAt:
          typeof parsed.loggedInAt === "string"
            ? parsed.loggedInAt
            : new Date().toISOString(),
        demo: true,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function getStaffSession(): StaffSession | null {
  if (typeof window === "undefined") return null;
  try {
    return (
      parseSession(window.sessionStorage.getItem(STAFF_SESSION_KEY)) ??
      parseSession(window.localStorage.getItem(STAFF_SESSION_KEY))
    );
  } catch {
    return null;
  }
}

/**
 * Stores a prototype-only staff session in localStorage (when remembered) or sessionStorage.
 * Passwords are never stored or checked per AGENTS.md rules.
 */
export function setStaffSession(
  staffId: string,
  remember = true,
): StaffSession {
  const cleanId = staffId.trim();
  const session: StaffSession = {
    staffId: cleanId,
    loggedInAt: new Date().toISOString(),
    demo: true,
  };
  if (typeof window !== "undefined") {
    try {
      const payload = JSON.stringify(session);
      window.sessionStorage.setItem(STAFF_SESSION_KEY, payload);
      if (remember) {
        window.localStorage.setItem(STAFF_SESSION_KEY, payload);
      } else {
        window.localStorage.removeItem(STAFF_SESSION_KEY);
      }
    } catch {
      // Ignore storage quota errors in restricted browsing modes
    }
  }
  return session;
}

export function clearStaffSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STAFF_SESSION_KEY);
    window.localStorage.removeItem(STAFF_SESSION_KEY);
  } catch {
    // Ignore storage errors
  }
}
