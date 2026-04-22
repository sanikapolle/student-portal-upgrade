import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useData, newId, type Student } from "@/lib/data";

export default function Students() {
  const { db, role, update } = useData();
  const isTeacher = role === "teacher";
  const [filter, setFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const [feeFilter, setFeeFilter] = useState<"all" | "paid" | "pending">("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState({ name: "", contact: "", subject: "", batch_id: "" });

  const batchName = (id: string | null) => db.batches.find((b) => b.id === id)?.name ?? "—";

  // Per-student fee status: pending if any pending fee exists, else paid
  const feeStatusFor = useMemo(() => {
    const map = new Map<string, "paid" | "pending" | "none">();
    for (const s of db.students) {
      const studentFees = db.fees.filter((f) => f.student_id === s.id);
      if (studentFees.length === 0) map.set(s.id, "none");
      else if (studentFees.some((f) => f.status === "pending")) map.set(s.id, "pending");
      else map.set(s.id, "paid");
    }
    return map;
  }, [db.students, db.fees]);

  const filtered = useMemo(
    () =>
      db.students.filter((s) => {
        const matchSearch =
          !filter ||
          s.name.toLowerCase().includes(filter.toLowerCase()) ||
          (s.contact ?? "").includes(filter) ||
          (s.subject ?? "").toLowerCase().includes(filter.toLowerCase());
        const matchBatch = batchFilter === "all" || s.batch_id === batchFilter;
        const status = feeStatusFor.get(s.id);
        const matchFee =
          feeFilter === "all" ||
          (feeFilter === "paid" && status === "paid") ||
          (feeFilter === "pending" && status === "pending");
        return matchSearch && matchBatch && matchFee;
      }),
    [db.students, filter, batchFilter, feeFilter, feeStatusFor]
  );

  const totals = useMemo(() => {
    let paid = 0, pending = 0, none = 0;
    for (const s of db.students) {
      const v = feeStatusFor.get(s.id);
      if (v === "paid") paid++;
      else if (v === "pending") pending++;
      else none++;
    }
    return { paid, pending, none };
  }, [db.students, feeStatusFor]);

  const openCreate = () => { setEditing(null); setForm({ name: "", contact: "", subject: "", batch_id: db.batches[0]?.id ?? "" }); setOpen(true); };
  const openEdit = (s: Student) => { setEditing(s); setForm({ name: s.name, contact: s.contact ?? "", subject: s.subject ?? "", batch_id: s.batch_id ?? "" }); setOpen(true); };

  const save = () => {
    if (!form.name.trim()) return toast.error("Name required");
    update((d) => {
      if (editing) {
        const s = d.students.find((x) => x.id === editing.id);
        if (s) {
          s.name = form.name.trim();
          s.contact = form.contact.trim() || null;
          s.subject = form.subject.trim() || null;
          s.batch_id = form.batch_id || null;
        }
      } else {
        d.students.push({
          id: newId(),
          user_id: null,
          name: form.name.trim(),
          contact: form.contact.trim() || null,
          subject: form.subject.trim() || null,
          batch_id: form.batch_id || null,
        });
      }
    });
    toast.success(editing ? "Student updated" : "Student added");
    setOpen(false);
  };

  const del = (id: string) => {
    if (!confirm("Delete this student?")) return;
    update((d) => {
      d.students = d.students.filter((s) => s.id !== id);
      d.fees = d.fees.filter((f) => f.student_id !== id);
    });
    toast.success("Deleted");
  };

  const exportCsv = () => {
    const rows = [
      ["Name", "Contact", "Subject", "Batch", "Fee Status"],
      ...filtered.map((s) => [s.name, s.contact ?? "", s.subject ?? "", batchName(s.batch_id), feeStatusFor.get(s.id) ?? "—"]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${(c ?? "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "students.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your student roster and fee status.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" className="glass" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          {isTeacher && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate} className="gradient-bg text-primary-foreground glow">
                  <Plus className="h-4 w-4 mr-2" /> Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card">
                <DialogHeader><DialogTitle>{editing ? "Edit Student" : "Add Student"}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="glass mt-1.5" /></div>
                  <div><Label>Contact</Label><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="glass mt-1.5" placeholder="Phone or email" /></div>
                  <div><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="glass mt-1.5" placeholder="e.g. Physics" /></div>
                  <div><Label>Batch</Label>
                    <Select value={form.batch_id} onValueChange={(v) => setForm({ ...form, batch_id: v })}>
                      <SelectTrigger className="glass mt-1.5"><SelectValue placeholder="Select batch" /></SelectTrigger>
                      <SelectContent>{db.batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter><Button onClick={save} className="gradient-bg text-primary-foreground">{editing ? "Save" : "Add"}</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Fee Paid / Pending summary cards (per request) */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setFeeFilter("paid")}
          className={`text-left glass-card rounded-2xl p-5 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 hover:scale-[1.01] transition ${feeFilter === "paid" ? "ring-2 ring-success" : ""}`}
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Fee Paid
          </div>
          <div className="text-2xl font-bold mt-1 text-success">{totals.paid}</div>
        </button>
        <button
          onClick={() => setFeeFilter("pending")}
          className={`text-left glass-card rounded-2xl p-5 bg-gradient-to-br from-rose-500/15 to-orange-500/10 hover:scale-[1.01] transition ${feeFilter === "pending" ? "ring-2 ring-destructive" : ""}`}
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5 text-destructive" /> Fee Pending
          </div>
          <div className="text-2xl font-bold mt-1 text-destructive">{totals.pending}</div>
        </button>
        <button
          onClick={() => setFeeFilter("all")}
          className={`text-left glass-card rounded-2xl p-5 hover:scale-[1.01] transition ${feeFilter === "all" ? "ring-2 ring-accent" : ""}`}
        >
          <div className="text-xs text-muted-foreground">All Students</div>
          <div className="text-2xl font-bold mt-1">{db.students.length}</div>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, contact or subject..." value={filter} onChange={(e) => setFilter(e.target.value)} className="glass pl-9" />
        </div>
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="glass sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All batches</SelectItem>
            {db.batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground">No students match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-white/5">
                <tr className="text-left text-xs text-muted-foreground uppercase">
                  <th className="p-4">Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Batch</th>
                  <th className="p-4">Fee Status</th>
                  {isTeacher && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const status = feeStatusFor.get(s.id);
                  return (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-white/5">
                      <td className="p-4 font-medium">{s.name}</td>
                      <td className="p-4 text-muted-foreground">{s.contact || "—"}</td>
                      <td className="p-4 text-muted-foreground">{s.subject || "—"}</td>
                      <td className="p-4"><span className="px-2 py-1 rounded-md glass text-xs">{batchName(s.batch_id)}</span></td>
                      <td className="p-4">
                        {status === "paid" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/15 text-success text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3" /> Paid
                          </span>
                        ) : status === "pending" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/15 text-destructive text-xs font-medium">
                            <AlertCircle className="h-3 w-3" /> Pending
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">No record</span>
                        )}
                      </td>
                      {isTeacher && (
                        <td className="p-4 text-right">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => del(s.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
