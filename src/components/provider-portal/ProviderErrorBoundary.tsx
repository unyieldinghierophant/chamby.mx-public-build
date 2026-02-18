import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

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
    console.error("[ProviderErrorBoundary] Caught error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-destructive" />
          <h2 className="text-lg font-semibold text-foreground">Algo salió mal</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Ocurrió un error inesperado. Intenta recargar la página.
          </p>
          <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded max-w-md break-all">
            {this.state.error?.message || "Error desconocido"}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="gap-2"
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
