import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { useData, newId, type Announcement } from "@/lib/data";

export default function Announcements() {
  const { db, role, update } = useData();
  const isTeacher = role === "teacher";
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const openCreate = () => { setEditing(null); setTitle(""); setContent(""); setOpen(true); };
  const openEdit = (a: Announcement) => { setEditing(a); setTitle(a.title); setContent(a.content); setOpen(true); };

  const save = () => {
    if (!title.trim() || !content.trim()) return toast.error("Title & content required");
    update((d) => {
      if (editing) {
        const a = d.announcements.find((x) => x.id === editing.id);
        if (a) { a.title = title.trim(); a.content = content.trim(); }
      } else {
        d.announcements.unshift({
          id: newId(),
          title: title.trim(),
          content: content.trim(),
          created_at: new Date().toISOString(),
        });
      }
    });
    toast.success(editing ? "Updated" : "Posted");
    setOpen(false);
  };

  const del = (id: string) => {
    if (!confirm("Delete?")) return;
    update((d) => { d.announcements = d.announcements.filter((a) => a.id !== id); });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground text-sm mt-1">Post updates for everyone in your institute.</p>
        </div>
        {isTeacher && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="gradient-bg text-primary-foreground glow">
                <Plus className="h-4 w-4 mr-2" /> New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card max-w-2xl">
              <DialogHeader><DialogTitle>{editing ? "Edit Announcement" : "New Announcement"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="glass mt-1.5" /></div>
                <div><Label>Content</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} className="glass mt-1.5" rows={8} /></div>
              </div>
              <DialogFooter><Button onClick={save} className="gradient-bg text-primary-foreground">{editing ? "Save" : "Post"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {db.announcements.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center text-muted-foreground">
          <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-40" /> No announcements yet.
        </div>
      ) : (
        <div className="space-y-3">
          {db.announcements.map((a) => (
            <div key={a.id} className="glass-card rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold">{a.title}</h3>
                  <div className="text-xs text-muted-foreground mt-0.5">{new Date(a.created_at).toLocaleString()}</div>
                </div>
                {isTeacher && (
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => del(a.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                )}
              </div>
              <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{a.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
