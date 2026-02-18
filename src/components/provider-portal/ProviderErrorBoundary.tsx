import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, Briefcase } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ProviderErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ProviderErrorBoundary] Caught error:", error);
    console.error("[ProviderErrorBoundary] Component stack:", info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-destructive" />
          <h2 className="text-lg font-semibold text-foreground">Algo salió mal</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Ocurrió un error inesperado. Puedes volver a la actividad o recargar la página.
          </p>
          <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded max-w-md break-all">
            {this.state.error?.message || "Error desconocido"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <Button
              className="w-full gap-2"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                // Use window.location for guaranteed navigation even if router is broken
                window.location.href = "/provider-portal";
              }}
            >
              <Briefcase className="w-4 h-4" />
              Ir a Actividad
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
            >
              <Home className="w-4 h-4" />
              Ir a Inicio
            </Button>
            <Button
              variant="ghost"
              className="w-full gap-2"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Recargar
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
