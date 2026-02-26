import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <Music className="h-16 w-16 text-muted-foreground" />
      <h2 className="text-2xl font-bold tracking-tight">404 - Page Not Found</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Could not find requested resource. The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link href="/">
        <Button variant="outline" className="mt-4">
          Return Home
        </Button>
      </Link>
    </div>
  );
}
