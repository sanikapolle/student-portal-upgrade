import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useData, newId, type Batch } from "@/lib/data";

export default function Batches() {
  const { db, role, update } = useData();
  const isTeacher = role === "teacher";
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Batch | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [time, setTime] = useState("");

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of db.students) {
      if (!s.batch_id) continue;
      map[s.batch_id] = (map[s.batch_id] ?? 0) + 1;
    }
    return map;
  }, [db.students]);

  const openCreate = () => {
    setEditing(null); setName(""); setDesc(""); setTime(""); setOpen(true);
  };
  const openEdit = (b: Batch) => {
    setEditing(b); setName(b.name); setDesc(b.description ?? ""); setTime(b.schedule_time ?? ""); setOpen(true);
  };

  const save = () => {
    if (!name.trim()) return toast.error("Name required");
    update((d) => {
      if (editing) {
        const b = d.batches.find((x) => x.id === editing.id);
        if (b) {
          b.name = name.trim();
          b.description = desc.trim() || null;
          b.schedule_time = time.trim() || null;
        }
      } else {
        d.batches.push({
          id: newId(),
          name: name.trim(),
          description: desc.trim() || null,
          schedule_time: time.trim() || null,
        });
      }
    });
    toast.success(editing ? "Batch updated" : "Batch created");
    setOpen(false);
  };

  const del = (id: string) => {
    if (!confirm("Delete this batch?")) return;
    update((d) => {
      d.batches = d.batches.filter((b) => b.id !== id);
      d.students = d.students.map((s) => (s.batch_id === id ? { ...s, batch_id: null } : s));
      d.schedule_entries = d.schedule_entries.filter((e) => e.batch_id !== id);
    });
    toast.success("Deleted");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Batches</h1>
          <p className="text-muted-foreground text-sm mt-1">Organize classes by batch.</p>
        </div>
        {isTeacher && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="gradient-bg text-primary-foreground glow">
                <Plus className="h-4 w-4 mr-2" /> New Batch
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader><DialogTitle>{editing ? "Edit Batch" : "New Batch"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="glass mt-1.5" placeholder="Batch C" /></div>
                <div><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="glass mt-1.5" placeholder="Weekend batch" /></div>
                <div><Label>Schedule Time</Label><Input value={time} onChange={(e) => setTime(e.target.value)} className="glass mt-1.5" placeholder="9:00 AM - 11:00 AM" /></div>
              </div>
              <DialogFooter><Button onClick={save} className="gradient-bg text-primary-foreground">{editing ? "Save" : "Create"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {db.batches.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
          No batches yet.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {db.batches.map((b) => (
            <div key={b.id} className="glass-card rounded-2xl p-5 hover:scale-[1.02] transition-transform">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-lg">{b.name}</h3>
                  {b.description && <p className="text-sm text-muted-foreground">{b.description}</p>}
                </div>
                {isTeacher && (
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(b)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => del(b.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                )}
              </div>
              {b.schedule_time && <div className="text-xs text-accent mt-3">{b.schedule_time}</div>}
              <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2 text-sm">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full glass text-xs">
                  <Users className="h-3 w-3 text-accent" /> {counts[b.id] ?? 0} student{(counts[b.id] ?? 0) !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
