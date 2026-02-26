import { AuthProvider } from "@/lib/auth-context";
import { DashboardContent } from "@/components/dashboard-client";

export default function DashboardPage() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
