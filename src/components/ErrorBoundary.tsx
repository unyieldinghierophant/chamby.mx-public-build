import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="text-center max-w-md space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Algo salió mal</h1>
            <p className="text-muted-foreground text-sm">
              Ocurrió un error inesperado. Por favor recarga la página o intenta de nuevo.
            </p>
            <Button onClick={() => window.location.reload()}>
              Recargar página
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
