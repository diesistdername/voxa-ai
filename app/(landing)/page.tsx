import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-y-4 text-center">
        <h1 className="text-4xl font-semibold">Voxa</h1>
        <p className="text-muted-foreground">AI-powered notes for your voice</p>
        <Button asChild>
          <Link href="/documents">Open App</Link>
        </Button>
      </div>
    </div>
  );
}
