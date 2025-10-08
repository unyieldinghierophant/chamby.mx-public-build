import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
      <h1 className="text-3xl font-semibold text-foreground">
        Welcome, {user?.user_metadata?.full_name || user?.email}
      </h1>
      <p className="mt-4 text-muted-foreground">You are now logged in.</p>
    </div>
  );
}
