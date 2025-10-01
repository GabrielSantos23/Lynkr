import React from "react";
import { Button } from "./ui/button";
import { LogIn } from "lucide-react";

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  return (
    <div className="w-full h-full bg-background flex items-center justify-center p-6 rounded-xl overflow-hidden">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <img src="/logo.png" alt="logo" className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome to Zyven
          </h1>
          <p className="text-muted-foreground">
            Sign in to access your bookmarks
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onLogin}
            className="w-full h-12 text-left justify-start"
          >
            <LogIn className="w-5 h-5 mr-3" />
            <div className="flex flex-col items-start">
              <span className="font-medium">Log in</span>
              <span className="text-xs text-muted-foreground">
                Sign in with Google or GitHub
              </span>
            </div>
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
