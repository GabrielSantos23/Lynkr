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
  const { data: session, isPending } = authClient.useSession();

  const isExtensionContext =
    window.opener && (window.name === "ZyvenLogin" || window.opener !== window);

  const handleAuthCallback = async () => {
    try {
      // Try to get session if not available
      let currentSession = session;
      if (!currentSession || !(currentSession as any)?.user) {
        console.log("Session not available, trying to get session...");
        try {
          const retrievedSession = await authClient.getSession();
          console.log("Retrieved session:", retrievedSession);
          // Use the retrieved session if it has user data
          if (retrievedSession && (retrievedSession as any)?.user) {
            currentSession = retrievedSession as any;
          }
        } catch (err) {
          console.error("Failed to get session:", err);
        }
      }

      if (!currentSession || !(currentSession as any)?.user) {
        console.error("No session found after retry. Session:", currentSession);
        console.error("Cookies available:", document.cookie);
        console.error("Current domain:", document.domain);
        console.error("Current URL:", window.location.href);
        // If we're in extension context and no session, redirect to login
        if (isExtensionContext) {
          console.log(
            "No session in extension context, redirecting to login..."
          );
          window.location.href = "/login";
          return;
        }

        setError("No active session found. Please try logging in again.");
        setIsProcessing(false);
        return;
      }

      const userData = {
        id: (currentSession as any).user.id,
        name: (currentSession as any).user.name || "",
        email: (currentSession as any).user.email || "",
        avatar: (currentSession as any).user.image || undefined,
        provider: (currentSession as any).user.provider || "google",
      };

      const token =
        (currentSession as any).token ||
        (currentSession as any).accessToken ||
        "mock-token";

      const message = {
        type: "AUTH_SUCCESS",
        user: userData,
        token: token,
      };

      console.log("Sending message to extension:", message);
      console.log("Window opener:", window.opener);
      console.log("Window opener closed:", window.opener?.closed);

      // Try to send the message to the parent window (extension)
      if (window.opener && !window.opener.closed) {
        console.log("Sending message via window.opener.postMessage");
        window.opener.postMessage(message, "*");
        window.close();
      } else {
        console.log("Sending message via window.postMessage (fallback)");
        window.postMessage(message, "*");

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

  useEffect(() => {
    if (!isPending) {
      if (session && (session as any)?.user) {
        // Add a small delay to ensure session is fully loaded
        setTimeout(() => {
          handleAuthCallback();
        }, 100);
      } else {
        setError("No active session found. Please try logging in again.");
        setIsProcessing(false);
      }
    }
  }, [session, isPending]);

  useEffect(() => {
    if (!isExtensionContext && !isPending && session) {
      window.location.href = "/bookmarks";
    }
  }, [isExtensionContext, isPending, session]);

  console.log("Extension callback - Session:", session);
  console.log("Extension callback - Session user:", (session as any)?.user);
  console.log("Extension callback - Is pending:", isPending);
  console.log("Extension callback - Is extension context:", isExtensionContext);
  console.log("Extension callback - Window opener:", window.opener);
  console.log("Extension callback - Window name:", window.name);
  console.log("Extension callback - Current URL:", window.location.href);
  console.log("Extension callback - Document domain:", document.domain);
  console.log("Extension callback - Cookies:", document.cookie);

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
