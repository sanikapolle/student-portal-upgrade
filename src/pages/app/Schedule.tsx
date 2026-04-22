import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Calendar as CalendarIcon, List as ListIcon, Clock } from "lucide-react";
import { toast } from "sonner";
import { useData, newId } from "@/lib/data";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Schedule() {
  const { db, role, update } = useData();
  const isTeacher = role === "teacher";
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ batch_id: "", day: "Mon", time: "10:00 AM", subject: "" });

  const batchName = (id: string) => db.batches.find((b) => b.id === id)?.name ?? "—";

  const add = () => {
    if (!form.batch_id || !form.subject.trim()) return toast.error("Fill required fields");
    update((d) => {
      d.schedule_entries.push({
        id: newId(),
        batch_id: form.batch_id,
        day: form.day,
        time: form.time,
        subject: form.subject.trim(),
      });
    });
    toast.success("Class added");
    setOpen(false);
  };

  const del = (id: string) => {
    if (!confirm("Delete?")) return;
    update((d) => {
      d.schedule_entries = d.schedule_entries.filter((e) => e.id !== id);
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Schedule</h1>
          <p className="text-muted-foreground text-sm mt-1">Weekly class schedule by batch.</p>
        </div>
        <div className="flex gap-2">
          <div className="glass rounded-lg p-1 flex">
            <Button size="sm" variant={view === "calendar" ? "default" : "ghost"} onClick={() => setView("calendar")} className={view === "calendar" ? "gradient-bg text-primary-foreground" : ""}>
              <CalendarIcon className="h-4 w-4" />
            </Button>
            <Button size="sm" variant={view === "list" ? "default" : "ghost"} onClick={() => setView("list")} className={view === "list" ? "gradient-bg text-primary-foreground" : ""}>
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
          {isTeacher && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-bg text-primary-foreground glow"><Plus className="h-4 w-4 mr-2" /> Add Class</Button>
              </DialogTrigger>
              <DialogContent className="glass-card">
                <DialogHeader><DialogTitle>Add Class</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Batch</Label>
                    <Select value={form.batch_id} onValueChange={(v) => setForm({ ...form, batch_id: v })}>
                      <SelectTrigger className="glass mt-1.5"><SelectValue placeholder="Select batch" /></SelectTrigger>
                      <SelectContent>{db.batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Day</Label>
                    <Select value={form.day} onValueChange={(v) => setForm({ ...form, day: v })}>
                      <SelectTrigger className="glass mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>{DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Time</Label><Input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="glass mt-1.5" placeholder="10:00 AM" /></div>
                  <div><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="glass mt-1.5" /></div>
                </div>
                <DialogFooter><Button onClick={add} className="gradient-bg text-primary-foreground">Add</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {view === "calendar" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {DAYS.map((d) => {
            const dayEntries = db.schedule_entries.filter((e) => e.day === d);
            return (
              <div key={d} className="glass-card rounded-2xl p-4 min-h-48">
                <div className="font-semibold text-sm mb-3 flex items-center justify-between">
                  <span>{d}</span>
                  <span className="text-xs text-muted-foreground">{dayEntries.length}</span>
                </div>
                <div className="space-y-2">
                  {dayEntries.map((e) => (
                    <div key={e.id} className="glass rounded-lg p-2.5 text-xs">
                      <div className="font-medium">{e.subject}</div>
                      <div className="text-accent flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" /> {e.time}</div>
                      <div className="text-muted-foreground">{batchName(e.batch_id)}</div>
                      {isTeacher && <Button size="icon" variant="ghost" className="h-6 w-6 mt-1" onClick={() => del(e.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>}
                    </div>
                  ))}
                  {dayEntries.length === 0 && <div className="text-xs text-muted-foreground/60">No classes</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card rounded-2xl divide-y divide-border/50">
          {db.schedule_entries.length === 0 ? (
            <div className="p-16 text-center text-muted-foreground">No classes scheduled.</div>
          ) : db.schedule_entries.map((e) => (
            <div key={e.id} className="p-4 flex items-center justify-between hover:bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-bg flex flex-col items-center justify-center text-primary-foreground glow">
                  <span className="text-[10px] uppercase font-bold">{e.day}</span>
                </div>
                <div>
                  <div className="font-semibold">{e.subject}</div>
                  <div className="text-xs text-muted-foreground">{batchName(e.batch_id)} · {e.time}</div>
                </div>
              </div>
              {isTeacher && <Button size="icon" variant="ghost" onClick={() => del(e.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
