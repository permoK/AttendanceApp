import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import StudentDashboard from "@/pages/student-dashboard";
import LecturerDashboard from "@/pages/lecturer-dashboard";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { useAuth } from "@/hooks/use-auth";

// Lazy-loaded components for better performance
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy load pages
const CoursesPage = lazy(() => import("@/pages/courses-page"));
const StudentsPage = lazy(() => import("@/pages/students-page"));
const AttendancePage = lazy(() => import("@/pages/attendance-page"));
const ReportsPage = lazy(() => import("@/pages/reports-page"));
const SettingsPage = lazy(() => import("@/pages/settings-page"));

// Loading component for suspense
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Main router component
function Router() {
  const { user } = useAuth();
  const [location] = useLocation();

  // Redirect based on user role if at root path
  if (location === "/" && user) {
    return (
      <Switch>
        <Route path="/">
          <Redirect to={user.role === "student" ? "/student" : "/lecturer"} />
        </Route>
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Student routes */}
      <ProtectedRoute 
        path="/student" 
        component={StudentDashboard}
        allowedRole="student"
      />
      
      {/* Lecturer routes */}
      <ProtectedRoute 
        path="/lecturer" 
        component={LecturerDashboard}
        allowedRole="lecturer"
      />
      
      {/* Common routes with role-based access */}
      <ProtectedRoute path="/courses">
        <Suspense fallback={<PageLoader />}>
          <CoursesPage />
        </Suspense>
      </ProtectedRoute>
      
      <ProtectedRoute path="/students" allowedRole="lecturer">
        <Suspense fallback={<PageLoader />}>
          <StudentsPage />
        </Suspense>
      </ProtectedRoute>
      
      <ProtectedRoute path="/attendance">
        <Suspense fallback={<PageLoader />}>
          <AttendancePage />
        </Suspense>
      </ProtectedRoute>
      
      <ProtectedRoute path="/reports" allowedRole="lecturer">
        <Suspense fallback={<PageLoader />}>
          <ReportsPage />
        </Suspense>
      </ProtectedRoute>
      
      <ProtectedRoute path="/settings">
        <Suspense fallback={<PageLoader />}>
          <SettingsPage />
        </Suspense>
      </ProtectedRoute>
      
      {/* Home route - redirect to auth if not logged in */}
      <Route path="/">
        {user ? (
          <Redirect to={user.role === "student" ? "/student" : "/lecturer"} />
        ) : (
          <AuthPage />
        )}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
