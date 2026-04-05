"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "extension-install-dismissed";

export function ExtensionInstallPrompt() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-2">
          Install Research Plus Extension
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Analyze any research URL directly from your browser. You can sync your
          saved website session and use the same API setup.
        </p>
        <div className="rounded-lg border p-3 mb-5 bg-muted/40 text-sm">
          Visit a paper URL, click the extension, sync website session, and get
          detailed insights instantly.
        </div>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => router.push("/extension")}>
            Open Setup Guide
          </Button>
          <Button variant="outline" onClick={handleDismiss}>
            Maybe Later
          </Button>
        </div>
      </div>
    </div>
  );
}
