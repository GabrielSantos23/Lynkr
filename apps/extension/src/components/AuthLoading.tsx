import React from "react";

const AuthLoading: React.FC = () => {
  return (
    <div className="w-full h-full bg-background flex items-center justify-center p-6 rounded-xl overflow-hidden">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-primary animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Loading...</h2>
          <p className="text-sm text-muted-foreground">
            Please wait while we check your authentication
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLoading;
