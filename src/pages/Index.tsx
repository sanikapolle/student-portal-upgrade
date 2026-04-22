import { Navigate } from "react-router-dom";

// Legacy index route — superseded by Landing in App.tsx routing.
const Index = () => <Navigate to="/" replace />;

export default Index;
