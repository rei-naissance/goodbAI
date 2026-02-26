import { AuthProvider } from "@/lib/auth-context";
import { LandingContent } from "@/components/landing-client";

export default function Home() {
  return (
    <AuthProvider>
      <LandingContent />
    </AuthProvider>
  );
}
