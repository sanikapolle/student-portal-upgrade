import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, CheckCircle2, Wallet, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useData, newId } from "@/lib/data";

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function Fees() {
  const { db, role, user, update, studentForUser } = useData();
  const isTeacher = role === "teacher";
  const isStudent = role === "student";
  const studentRecord = isStudent && user ? studentForUser(user.id) : null;

  const [filter, setFilter] = useState<"all" | "paid" | "pending">("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    student_id: "",
    month: monthKey(),
    amount: "4500",
  });

  const studentName = (id: string) => db.students.find((x) => x.id === id)?.name ?? "Unknown";

  const visibleFees = useMemo(() => {
    if (isStudent) {
      if (!studentRecord) return [];
      return db.fees.filter((f) => f.student_id === studentRecord.id);
    }
    return db.fees;
  }, [db.fees, isStudent, studentRecord]);

  const filtered = useMemo(
    () => visibleFees.filter((f) => filter === "all" || f.status === filter),
    [visibleFees, filter]
  );

  const totals = useMemo(() => {
    const paid = visibleFees.filter((f) => f.status === "paid").reduce((s, f) => s + Number(f.amount), 0);
    const pending = visibleFees.filter((f) => f.status === "pending").reduce((s, f) => s + Number(f.amount), 0);
    return { paid, pending, total: paid + pending };
  }, [visibleFees]);

  const add = () => {
    if (!form.student_id) return toast.error("Select a student");
    update((d) => {
      d.fees.unshift({
        id: newId(),
        student_id: form.student_id,
        month: form.month,
        amount: Number(form.amount) || 0,
        status: "pending",
        paid_at: null,
      });
    });
    toast.success("Fee record added");
    setOpen(false);
  };

  const markPaid = (id: string) => {
    update((d) => {
      const f = d.fees.find((x) => x.id === id);
      if (f) {
        f.status = "paid";
        f.paid_at = new Date().toISOString();
      }
    });
    toast.success("Marked as paid");
  };

  const sendReminder = (name: string) => {
    toast.success(`Reminder sent to ${name}`, {
      description: "Monthly fee reminder notification queued.",
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">{isStudent ? "My Fees" : "Fee Tracker"}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isStudent ? "Your monthly fee history — paid & pending." : "Monthly fees, paid / pending status."}
          </p>
        </div>
        {isTeacher && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-bg text-primary-foreground glow">
                <Plus className="h-4 w-4 mr-2" /> Add Fee
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader><DialogTitle>Add Fee Record</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Student</Label>
                  <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                    <SelectTrigger className="glass mt-1.5"><SelectValue placeholder="Pick student" /></SelectTrigger>
                    <SelectContent>{db.students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Month (YYYY-MM)</Label><Input value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="glass mt-1.5" /></div>
                <div><Label>Amount (₹)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="glass mt-1.5" /></div>
              </div>
              <DialogFooter><Button onClick={add} className="gradient-bg text-primary-foreground">Add</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-emerald-500/15 to-teal-500/10">
          <div className="text-xs text-muted-foreground">Collected</div>
          <div className="text-2xl font-bold mt-1 text-success">₹{totals.paid.toLocaleString()}</div>
        </div>
        <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-rose-500/15 to-orange-500/10">
          <div className="text-xs text-muted-foreground">Pending</div>
          <div className="text-2xl font-bold mt-1 text-destructive">₹{totals.pending.toLocaleString()}</div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="text-xs text-muted-foreground">Total billed</div>
          <div className="text-2xl font-bold mt-1">₹{totals.total.toLocaleString()}</div>
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "pending", "paid"] as const).map((t) => (
          <Button
            key={t}
            variant={filter === t ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(t)}
            className={filter === t ? "gradient-bg text-primary-foreground" : "glass"}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-3 opacity-40" /> No fee records.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-white/5">
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  {isTeacher && <th className="p-4">Student</th>}
                  <th className="p-4">Month</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  {isTeacher && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f.id} className="border-b border-border/50 hover:bg-white/5">
                    {isTeacher && <td className="p-4 font-medium">{studentName(f.student_id)}</td>}
                    <td className="p-4 text-muted-foreground">{f.month}</td>
                    <td className="p-4">₹{Number(f.amount).toLocaleString()}</td>
                    <td className="p-4">
                      {f.status === "paid" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/15 text-success text-xs font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/15 text-destructive text-xs font-medium">
                          <AlertCircle className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </td>
                    {isTeacher && (
                      <td className="p-4 text-right space-x-1">
                        {f.status !== "paid" && (
                          <>
                            <Button size="sm" variant="outline" className="glass" onClick={() => sendReminder(studentName(f.student_id))}>Remind</Button>
                            <Button size="sm" className="gradient-bg text-primary-foreground" onClick={() => markPaid(f.id)}>Mark Paid</Button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
