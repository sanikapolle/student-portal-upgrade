import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CustomCursor } from "@/components/CustomCursor";
import { DataProvider, useData } from "@/lib/data";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import Batches from "./pages/app/Batches";
import Students from "./pages/app/Students";
import Fees from "./pages/app/Fees";
import Schedule from "./pages/app/Schedule";
import Announcements from "./pages/app/Announcements";
import Profile from "./pages/app/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedShell() {
  const { user } = useData();
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DataProvider>
        <CustomCursor />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/app" element={<ProtectedShell />}>
              <Route index element={<Dashboard />} />
              <Route path="batches" element={<Batches />} />
              <Route path="students" element={<Students />} />
              <Route path="fees" element={<Fees />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
