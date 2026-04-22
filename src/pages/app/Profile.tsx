import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Mail, Shield, Users, GraduationCap, BookOpen } from "lucide-react";
import { useData } from "@/lib/data";

export default function Profile() {
  const { db, user, role, update, studentForUser } = useData();

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [subject, setSubject] = useState("");
  const [batchId, setBatchId] = useState<string>("");
  const [contact, setContact] = useState("");
  const [qualification, setQualification] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.full_name);
    setAvatarUrl(user.avatar_url ?? "");
    if (role === "student") {
      const sr = studentForUser(user.id);
      // Prefer the linked student record so subject stays in sync everywhere
      setSubject(sr?.subject ?? user.subject ?? "");
      setBatchId(sr?.batch_id ?? user.batch_id ?? "");
      setContact(sr?.contact ?? user.contact ?? "");
    }
    if (role === "teacher") {
      setQualification(user.qualification ?? "");
    }
  }, [user, role, studentForUser]);

  const stats = useMemo(
    () => ({ students: db.students.length, batches: db.batches.length }),
    [db]
  );

  if (!user) return null;

  const initials = (name || "U").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  const save = () => {
    update((d) => {
      const u = d.users.find((x) => x.id === user.id);
      if (!u) return;
      u.full_name = name;
      u.avatar_url = avatarUrl || null;
      if (role === "student") {
        u.subject = subject || null;
        u.batch_id = batchId || null;
        // Mirror onto the student record so the rest of the app sees it
        const sr = d.students.find((s) => s.user_id === user.id);
        if (sr) {
          sr.name = name;
          sr.subject = subject || null;
          sr.batch_id = batchId || null;
        }
      }
    });
    toast.success("Profile updated");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>

      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-5 flex-wrap">
          <Avatar className="h-20 w-20 border-2 border-accent/40">
            {avatarUrl && <AvatarImage src={avatarUrl} />}
            <AvatarFallback className="text-xl gradient-bg text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold">{user.full_name}</div>
            <div className="text-muted-foreground flex items-center gap-1.5 mt-1">
              <Mail className="h-3.5 w-3.5" /> {user.email}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full glass text-xs">
                <Shield className="h-3 w-3 text-accent" /> {role === "teacher" ? "Teacher · Admin" : "Student"}
              </span>
              {role === "student" && subject && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/15 text-accent text-xs font-medium">
                  <BookOpen className="h-3 w-3" /> {subject}
                </span>
              )}
            </div>
          </div>
        </div>

        {role === "teacher" && (
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="glass rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg gradient-bg glow"><GraduationCap className="h-4 w-4 text-primary-foreground" /></div>
              <div>
                <div className="text-xl font-bold">{stats.students}</div>
                <div className="text-xs text-muted-foreground">Students managed</div>
              </div>
            </div>
            <div className="glass rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg gradient-bg glow"><Users className="h-4 w-4 text-primary-foreground" /></div>
              <div>
                <div className="text-xl font-bold">{stats.batches}</div>
                <div className="text-xs text-muted-foreground">Batches</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold">Edit Profile</h2>
        <div>
          <Label>Full Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="glass mt-1.5" />
        </div>
        <div>
          <Label>Avatar URL</Label>
          <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="glass mt-1.5" placeholder="https://..." />
        </div>

        {role === "student" && (
          <>
            <div>
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="glass mt-1.5"
                placeholder="e.g. Physics, Mathematics, Chemistry"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Shown on your dashboard and in the teacher's roster.
              </p>
            </div>
            <div>
              <Label>Batch</Label>
              <Select value={batchId} onValueChange={setBatchId}>
                <SelectTrigger className="glass mt-1.5"><SelectValue placeholder="Pick your batch" /></SelectTrigger>
                <SelectContent>
                  {db.batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <Button onClick={save} className="gradient-bg text-primary-foreground glow">Save Changes</Button>
      </div>
    </div>
  );
}
