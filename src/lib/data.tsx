import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Role = "teacher" | "student";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  avatar_url: string | null;
  // Student-only profile fields
  subject: string | null;
  batch_id: string | null;
  contact: string | null;
  // Teacher-only profile fields
  qualification: string | null;
}

export interface Batch {
  id: string;
  name: string;
  description: string | null;
  schedule_time: string | null;
}

export interface Student {
  id: string;
  user_id: string | null;
  name: string;
  contact: string | null;
  subject: string | null;
  batch_id: string | null;
}

export interface Fee {
  id: string;
  student_id: string;
  month: string;
  amount: number;
  status: "paid" | "pending";
  paid_at: string | null;
}

export interface ScheduleEntry {
  id: string;
  batch_id: string;
  day: string;
  time: string;
  subject: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface DB {
  users: UserProfile[];
  batches: Batch[];
  students: Student[];
  fees: Fee[];
  schedule_entries: ScheduleEntry[];
  announcements: Announcement[];
  session: { user_id: string | null };
}

const STORAGE_KEY = "batchflow.db.v1";

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function seed(): DB {
  const teacherId = uid();
  const studentId = uid();
  const studentUserId = uid();
  const batchA = { id: uid(), name: "Batch A — Physics", description: "JEE Main · Mon/Wed/Fri", schedule_time: "5:00 PM - 7:00 PM" };
  const batchB = { id: uid(), name: "Batch B — Chemistry", description: "NEET · Tue/Thu/Sat", schedule_time: "4:00 PM - 6:00 PM" };
  const batchC = { id: uid(), name: "Batch C — Mathematics", description: "Board prep · Daily", schedule_time: "7:30 AM - 9:00 AM" };

  return {
    users: [
      { id: teacherId, email: "teacher@batchflow.app", full_name: "Riya Mehta", role: "teacher", avatar_url: null, subject: null, batch_id: null, contact: null, qualification: "M.Sc. Physics, B.Ed." },
      { id: studentUserId, email: "student@batchflow.app", full_name: "Aanya Kapoor", role: "student", avatar_url: null, subject: "Physics", batch_id: batchA.id, contact: "+91 98765 43210", qualification: null },
    ],
    batches: [batchA, batchB, batchC],
    students: [
      { id: studentId, user_id: studentUserId, name: "Aanya Kapoor", contact: "+91 98765 43210", subject: "Physics", batch_id: batchA.id },
      { id: uid(), user_id: null, name: "Rohan Singh", contact: "+91 99887 11223", subject: "Chemistry", batch_id: batchB.id },
      { id: uid(), user_id: null, name: "Meera Iyer", contact: "+91 90011 22334", subject: "Mathematics", batch_id: batchC.id },
      { id: uid(), user_id: null, name: "Kabir Verma", contact: "+91 91111 22222", subject: "Physics", batch_id: batchA.id },
    ],
    fees: [
      { id: uid(), student_id: studentId, month: "2026-03", amount: 4500, status: "paid", paid_at: "2026-03-05T10:00:00Z" },
      { id: uid(), student_id: studentId, month: "2026-04", amount: 4500, status: "pending", paid_at: null },
    ],
    schedule_entries: [
      { id: uid(), batch_id: batchA.id, day: "Mon", time: "5:00 PM", subject: "Mechanics" },
      { id: uid(), batch_id: batchA.id, day: "Wed", time: "5:00 PM", subject: "Optics" },
      { id: uid(), batch_id: batchB.id, day: "Tue", time: "4:00 PM", subject: "Organic Chemistry" },
      { id: uid(), batch_id: batchC.id, day: "Mon", time: "7:30 AM", subject: "Algebra" },
    ],
    announcements: [
      { id: uid(), title: "Mid-term Test on April 28", content: "Dear students,\n\nThe mid-term assessment will be conducted on Monday, April 28th, covering chapters 1-5. Please bring your calculators and writing material. All the best!\n\n— Riya Mehta", created_at: new Date().toISOString() },
      { id: uid(), title: "Holiday Notice", content: "The institute will remain closed on April 25th in observance of a public holiday. Regular classes resume the next day.", created_at: new Date(Date.now() - 86400000).toISOString() },
    ],
    session: { user_id: null },
  };
}

function load(): DB {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return JSON.parse(raw) as DB;
  } catch {
    return seed();
  }
}

function persist(db: DB) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

interface DataContextValue {
  db: DB;
  user: UserProfile | null;
  role: Role | null;
  // Auth
  login: (email: string, role: Role) => Promise<UserProfile>;
  signup: (input: { full_name: string; email: string; role: Role; batch_id?: string; subject?: string }) => Promise<UserProfile>;
  logout: () => void;
  // Mutations (return updated DB so callers can refresh)
  update: (updater: (draft: DB) => void) => void;
  // Helpers
  studentForUser: (userId: string) => Student | null;
}

const Ctx = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => load());

  useEffect(() => {
    persist(db);
  }, [db]);

  const update = useCallback((updater: (draft: DB) => void) => {
    setDb((prev) => {
      const next: DB = JSON.parse(JSON.stringify(prev));
      updater(next);
      return next;
    });
  }, []);

  const user = useMemo(
    () => db.users.find((u) => u.id === db.session.user_id) ?? null,
    [db]
  );

  const login: DataContextValue["login"] = async (email, role) => {
    let existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!existing) {
      // Auto-create demo account so users can play with any email
      existing = {
        id: uid(),
        email,
        full_name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        role,
        avatar_url: null,
        subject: role === "student" ? null : null,
        batch_id: role === "student" ? db.batches[0]?.id ?? null : null,
      };
      update((d) => {
        d.users.push(existing!);
        if (role === "student") {
          d.students.push({
            id: uid(),
            user_id: existing!.id,
            name: existing!.full_name,
            contact: null,
            subject: null,
            batch_id: existing!.batch_id,
          });
        }
        d.session.user_id = existing!.id;
      });
    } else {
      update((d) => {
        // Update role if user picked a different one (demo flexibility)
        const u = d.users.find((x) => x.id === existing!.id)!;
        u.role = role;
        d.session.user_id = existing!.id;
      });
    }
    return existing;
  };

  const signup: DataContextValue["signup"] = async ({ full_name, email, role, batch_id, subject }) => {
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("An account with that email already exists. Try logging in.");
    }
    const newUser: UserProfile = {
      id: uid(),
      email,
      full_name,
      role,
      avatar_url: null,
      subject: role === "student" ? subject ?? null : null,
      batch_id: role === "student" ? batch_id ?? null : null,
    };
    update((d) => {
      d.users.push(newUser);
      if (role === "student") {
        d.students.push({
          id: uid(),
          user_id: newUser.id,
          name: full_name,
          contact: null,
          subject: subject ?? null,
          batch_id: batch_id ?? null,
        });
      }
      d.session.user_id = newUser.id;
    });
    return newUser;
  };

  const logout = () => {
    update((d) => {
      d.session.user_id = null;
    });
  };

  const studentForUser = (userId: string) =>
    db.students.find((s) => s.user_id === userId) ?? null;

  const value: DataContextValue = {
    db,
    user,
    role: user?.role ?? null,
    login,
    signup,
    logout,
    update,
    studentForUser,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

export const newId = uid;
