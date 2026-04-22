import { Link } from "react-router-dom";
import { useData } from "@/lib/data";
import {
  GraduationCap,
  Users,
  Wallet,
  Calendar,
  Megaphone,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { useMemo } from "react";

export default function Dashboard() {
  const { db, user, role, studentForUser } = useData();
  const isTeacher = role === "teacher";
  const isStudent = role === "student";

  const studentRecord = isStudent && user ? studentForUser(user.id) : null;
  const myBatch = useMemo(
    () => db.batches.find((b) => b.id === (studentRecord?.batch_id ?? user?.batch_id ?? "")),
    [db.batches, studentRecord, user]
  );
  const myFees = useMemo(
    () => (studentRecord ? db.fees.filter((f) => f.student_id === studentRecord.id) : []),
    [db.fees, studentRecord]
  );
  const pendingFeesMine = myFees.filter((f) => f.status === "pending");
  const paidFeesMine = myFees.filter((f) => f.status === "paid");

  const teacherStats = {
    students: db.students.length,
    batches: db.batches.length,
    pendingFees: db.fees.filter((f) => f.status === "pending").length,
    upcomingClasses: db.schedule_entries.length,
  };

  const recent = db.announcements.slice(0, 3);

  const cards = isTeacher
    ? [
        { label: "Total Students", value: teacherStats.students, icon: GraduationCap, color: "from-blue-500/20 to-cyan-500/20" },
        { label: "Total Batches", value: teacherStats.batches, icon: Users, color: "from-indigo-500/20 to-purple-500/20" },
        { label: "Pending Fees", value: teacherStats.pendingFees, icon: Wallet, color: "from-rose-500/20 to-orange-500/20" },
        { label: "Scheduled Classes", value: teacherStats.upcomingClasses, icon: Calendar, color: "from-emerald-500/20 to-teal-500/20" },
      ]
    : [
        { label: "My Batch", value: myBatch?.name?.split("—")[0]?.trim() ?? "—", icon: Users, color: "from-blue-500/20 to-cyan-500/20" },
        { label: "Subject", value: studentRecord?.subject ?? user?.subject ?? "—", icon: BookOpen, color: "from-indigo-500/20 to-purple-500/20" },
        { label: "Fees Paid", value: paidFeesMine.length, icon: CheckCircle2, color: "from-emerald-500/20 to-teal-500/20" },
        { label: "Fees Pending", value: pendingFeesMine.length, icon: AlertCircle, color: "from-rose-500/20 to-orange-500/20" },
      ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Welcome back,{" "}
          <span className="gradient-text">{user?.full_name?.split(" ")[0] || "there"}</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          {isTeacher
            ? "Here's what's happening at your institute today."
            : "Your latest updates, fees and schedule."}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`glass-card rounded-2xl p-5 bg-gradient-to-br ${c.color} hover:scale-[1.02] transition-transform`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-white/10">
                <c.icon className="h-4 w-4" />
              </div>
              {isTeacher && <TrendingUp className="h-3 w-3 text-success" />}
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-bold truncate">{c.value as React.ReactNode}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Student-only: Pending board (now functional) */}
      {isStudent && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <h2 className="font-semibold">Pending</h2>
              <span className="ml-auto text-xs text-muted-foreground">{pendingFeesMine.length} item(s)</span>
            </div>
            {pendingFeesMine.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                🎉 You're all caught up! No pending fees.
              </div>
            ) : (
              <div className="space-y-2">
                {pendingFeesMine.map((f) => (
                  <div key={f.id} className="glass rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">Fees · {f.month}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Due this month</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-destructive">₹{f.amount.toLocaleString()}</div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-[10px] font-semibold uppercase mt-1">
                        Pending
                      </span>
                    </div>
                  </div>
                ))}
                <Link to="/app/fees" className="block text-center text-xs text-accent font-medium pt-2 hover:underline">
                  View all fee records →
                </Link>
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <h2 className="font-semibold">Recently Paid</h2>
            </div>
            {paidFeesMine.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">No payments yet.</div>
            ) : (
              <div className="space-y-2">
                {paidFeesMine.map((f) => (
                  <div key={f.id} className="glass rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">Fees · {f.month}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Paid {f.paid_at ? new Date(f.paid_at).toLocaleDateString() : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-success">₹{f.amount.toLocaleString()}</div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/15 text-success text-[10px] font-semibold uppercase mt-1">
                        Paid
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="h-4 w-4 text-accent" />
          <h2 className="font-semibold">Recent Announcements</h2>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No announcements yet.</div>
        ) : (
          <div className="space-y-3">
            {recent.map((a) => (
              <div key={a.id} className="glass rounded-xl p-4">
                <div className="font-semibold">{a.title}</div>
                <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-3">{a.content}</div>
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date(a.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
