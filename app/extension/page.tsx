import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ExtensionSetupPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <h1 className="text-3xl font-bold">Research Plus Browser Extension</h1>
        <p className="text-muted-foreground">
          Install once, then analyze any research URL directly in your browser
          using your website session.
        </p>

        <Card className="p-6 space-y-3">
          <h2 className="text-xl font-semibold">Setup Steps</h2>
          <p className="text-sm">
            1. Open chrome://extensions and enable Developer mode.
          </p>
          <p className="text-sm">
            2. Click Load unpacked and select the extension folder from this
            project.
          </p>
          <p className="text-sm">
            3. Open any research URL and click the Research Plus extension icon.
          </p>
          <p className="text-sm">
            4. Click Use Saved Session From Website in extension popup.
          </p>
          <p className="text-sm">
            5. Click Analyze to get detailed summary and insights in the popup.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-xl font-semibold">Pro Tip</h2>
          <p className="text-sm text-muted-foreground">
            Keep one tab of this website open and logged in. The extension can
            sync auth and saved LLM credentials from it.
          </p>
        </Card>

        <Link href="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
