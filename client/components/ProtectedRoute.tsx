import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { UserRole } from "@shared/dao";

interface ProtectedRouteProps {
  children: ReactNode;
  requireRoles?: UserRole[];
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requireRoles,
  fallback,
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth is being verified
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">
              Vérification de l'authentification...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requireRoles && !hasRole(requireRoles)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <div className="text-red-600 mb-4">⛔ Accès refusé</div>
            <h3 className="text-lg font-semibold mb-2">
              Permissions insuffisantes
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Vous n'avez pas les permissions nécessaires pour accéder à cette
              page.
            </p>
            <div className="text-xs text-muted-foreground">
              <div>
                Votre rôle: <span className="font-medium">{user.role}</span>
              </div>
              <div>
                Rôles requis:{" "}
                <span className="font-medium">{requireRoles.join(", ")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

// Convenience components for common role requirements
export function AdminRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute requireRoles={["admin"]}>{children}</ProtectedRoute>;
}

export function UserRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireRoles={["admin", "user"]}>{children}</ProtectedRoute>
  );
}

export function AuthenticatedRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
