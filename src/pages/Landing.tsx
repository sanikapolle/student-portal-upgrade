import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ArrowRight, Sparkles, Users, Wallet, Calendar, Megaphone, Shield, MousePointer2 } from "lucide-react";
import { useData } from "@/lib/data";

const features = [
  { icon: Users, title: "Batch & Student Management", desc: "Organize batches, track students, edit anything in one click." },
  { icon: Wallet, title: "Smart Fee Tracker", desc: "Monthly tracking with paid/pending status and color-coded alerts." },
  { icon: Calendar, title: "Schedule", desc: "Calendar and list views per batch — never miss a class." },
  { icon: Megaphone, title: "Announcements", desc: "Post polished updates students see instantly on their dashboard." },
  { icon: Shield, title: "Role-based Access", desc: "Teachers manage everything. Students get a focused dashboard." },
  { icon: MousePointer2, title: "Delightful Cursor", desc: "A custom cursor with playful click bursts on every page." },
];

export default function Landing() {
  const { user } = useData();
  if (user) return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen">
      <header className="px-6 py-5 flex items-center justify-between max-w-7xl mx-auto">
        <Logo size={44} />
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link to="/login?tab=signup">
            <Button className="gradient-bg text-primary-foreground glow">Get started</Button>
          </Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-muted-foreground mb-8">
          <Sparkles className="h-3 w-3 text-accent" /> Built for modern coaching institutes
        </div>
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.05]">
          Run your coaching <br />
          institute, <span className="gradient-text">beautifully.</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          BatchFlow brings batches, students, fees, schedules and announcements into one
          modern dashboard for teachers and students.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
          <Link to="/login?tab=signup">
            <Button size="lg" className="gradient-bg text-primary-foreground glow h-12 px-7">
              Start free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="h-12 px-7 glass">Sign in</Button>
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f) => (
          <div key={f.title} className="glass-card rounded-2xl p-6 hover:scale-[1.02] transition-transform">
            <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center glow">
              <f.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} BatchFlow. Built for educators.
      </footer>
    </div>
  );
}
