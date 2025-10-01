import { createFileRoute } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import Loader from "@/components/loader";

export const Route = createFileRoute("/extension-callback")({
  component: ExtensionCallbackComponent,
});

function ExtensionCallbackComponent() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current session
        const session = await authClient.getSession();

        if (!session || !(session as any)?.user) {
          setError("No active session found");
          setIsProcessing(false);
          return;
        }

        // Prepare user data for the extension
        const userData = {
          id: (session as any).user.id,
          name: (session as any).user.name || "",
          email: (session as any).user.email || "",
          avatar: (session as any).user.image || undefined,
          provider: (session as any).user.provider || "google", // Default to google if not specified
        };

        // Get the auth token (you may need to adjust this based on your auth implementation)
        const token =
          (session as any).token ||
          (session as any).accessToken ||
          "mock-token";

        // Send message to the extension
        const message = {
          type: "AUTH_SUCCESS",
          user: userData,
          token: token,
        };

        // Try to send the message to the parent window (extension)
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(message, "*");
          window.close();
        } else {
          // Fallback: try to communicate with the extension via postMessage
          window.postMessage(message, "*");

          // Show success message and close after a delay
          setTimeout(() => {
            window.close();
          }, 2000);
        }
      } catch (err) {
        console.error("Extension callback error:", err);
        setError("Failed to process authentication");
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-[#161616] text-muted-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-400 mb-4">
            Authentication Error
          </h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#161616] text-muted-foreground flex items-center justify-center">
      <div className="text-center">
        <Loader />
        <h1 className="text-xl font-semibold text-foreground mt-4 mb-2">
          Authentication Successful
        </h1>
        <p className="text-muted-foreground">
          Sending credentials to extension...
        </p>
      </div>
    </div>
  );
}
