import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useData, type Role } from "@/lib/data";

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialTab = params.get("tab") === "signup" ? "signup" : "login";
  const { db, user, login, signup } = useData();

  const [tab, setTab] = useState<"login" | "signup">(initialTab);

  // Login state
  const [loginEmail, setLoginEmail] = useState("teacher@batchflow.app");
  const [loginRole, setLoginRole] = useState<Role>("teacher");
  const [loadingLogin, setLoadingLogin] = useState(false);

  // Signup state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [signupRole, setSignupRole] = useState<Role>("teacher");
  const [batchId, setBatchId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [loadingSignup, setLoadingSignup] = useState(false);

  useEffect(() => {
    if (user) navigate("/app", { replace: true });
  }, [user, navigate]);

  // Sync demo email when role toggle flips
  useEffect(() => {
    if (loginRole === "student") setLoginEmail("student@batchflow.app");
    else setLoginEmail("teacher@batchflow.app");
  }, [loginRole]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingLogin(true);
    try {
      await login(loginEmail, loginRole);
      toast.success("Welcome back!");
      navigate("/app");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupRole === "student" && !batchId) {
      toast.error("Please select a batch");
      return;
    }
    setLoadingSignup(true);
    try {
      await signup({
        full_name: name,
        email,
        role: signupRole,
        batch_id: signupRole === "student" ? batchId : undefined,
        subject: signupRole === "student" ? subject : undefined,
      });
      toast.success("Account created! Welcome to BatchFlow.");
      navigate("/app");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoadingSignup(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/30 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-accent/20 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link to="/"><Logo size={48} /></Link>
        </div>

        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2 glass">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="rounded-lg p-3 text-xs text-muted-foreground glass">
                  Demo mode — any email works. Try{" "}
                  <span className="text-accent font-medium">teacher@batchflow.app</span> or{" "}
                  <span className="text-accent font-medium">student@batchflow.app</span>.
                </div>
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="glass mt-1.5" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Login as</Label>
                  <RadioGroup value={loginRole} onValueChange={(v) => setLoginRole(v as Role)} className="grid grid-cols-2 gap-2 mt-1.5">
                    <label className={`glass rounded-lg p-3 flex items-center gap-2 text-sm ${loginRole === "teacher" ? "ring-2 ring-accent" : ""}`}>
                      <RadioGroupItem value="teacher" /> Teacher
                    </label>
                    <label className={`glass rounded-lg p-3 flex items-center gap-2 text-sm ${loginRole === "student" ? "ring-2 ring-accent" : ""}`}>
                      <RadioGroupItem value="student" /> Student
                    </label>
                  </RadioGroup>
                </div>
                <Button type="submit" disabled={loadingLogin} className="w-full gradient-bg text-primary-foreground glow h-11">
                  {loadingLogin ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => setTab("signup")} className="text-accent font-medium hover:underline">
                    Sign Up
                  </button>
                </p>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input id="signup-name" required value={name} onChange={(e) => setName(e.target.value)} className="glass mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="glass mt-1.5" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">I am a</Label>
                  <RadioGroup value={signupRole} onValueChange={(v) => setSignupRole(v as Role)} className="grid grid-cols-2 gap-2 mt-1.5">
                    <label className={`glass rounded-lg p-3 flex items-center gap-2 text-sm ${signupRole === "teacher" ? "ring-2 ring-accent" : ""}`}>
                      <RadioGroupItem value="teacher" /> Teacher
                    </label>
                    <label className={`glass rounded-lg p-3 flex items-center gap-2 text-sm ${signupRole === "student" ? "ring-2 ring-accent" : ""}`}>
                      <RadioGroupItem value="student" /> Student
                    </label>
                  </RadioGroup>
                </div>
                {signupRole === "student" && (
                  <>
                    <div>
                      <Label>Subject</Label>
                      <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="glass mt-1.5" placeholder="e.g. Physics" />
                    </div>
                    <div>
                      <Label>Select Batch</Label>
                      <Select value={batchId} onValueChange={setBatchId}>
                        <SelectTrigger className="glass mt-1.5"><SelectValue placeholder="Choose your batch" /></SelectTrigger>
                        <SelectContent>
                          {db.batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <Button type="submit" disabled={loadingSignup} className="w-full gradient-bg text-primary-foreground glow h-11">
                  {loadingSignup ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
