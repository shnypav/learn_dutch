import type { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import AuthScreen from "./AuthScreen";

interface AuthGateProps {
  children: ReactNode;
}

const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin mb-4" />
          <p className="text-primary text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <>{children}</>;
};

export default AuthGate;
