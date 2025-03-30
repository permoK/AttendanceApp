import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

type Role = "student" | "lecturer";

type ProtectedRouteProps = {
  path: string;
  allowedRole?: Role;
} & (
  | { component: () => React.JSX.Element; children?: never }
  | { component?: never; children: ReactNode }
);

export function ProtectedRoute({
  path,
  component: Component,
  children,
  allowedRole,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !user ? (
        <Redirect to="/auth" />
      ) : allowedRole && user.role !== allowedRole ? (
        <Redirect to={user.role === "student" ? "/student" : "/lecturer"} />
      ) : Component ? (
        <Component />
      ) : (
        children
      )}
    </Route>
  );
}
