import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Calendar,
  Home,
  LogOut,
  Settings,
  Users,
  BarChart,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const isStudent = user?.role === "student";
  const isLecturer = user?.role === "lecturer";

  const navItems = [
    {
      title: "Dashboard",
      icon: <Home className="w-5 h-5" />,
      href: "/",
      active: location === "/",
      show: true,
    },
    {
      title: "Courses",
      icon: <BookOpen className="w-5 h-5" />,
      href: "/courses",
      active: location === "/courses",
      show: true,
    },
    {
      title: "Students",
      icon: <Users className="w-5 h-5" />,
      href: "/students",
      active: location === "/students",
      show: isLecturer,
    },
    {
      title: "Attendance",
      icon: <Calendar className="w-5 h-5" />,
      href: "/attendance",
      active: location === "/attendance",
      show: true,
    },
    {
      title: "Reports",
      icon: <BarChart className="w-5 h-5" />,
      href: "/reports",
      active: location === "/reports",
      show: isLecturer,
    },
    {
      title: "Settings",
      icon: <Settings className="w-5 h-5" />,
      href: "/settings",
      active: location === "/settings",
      show: true,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-primary mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <h1 className="text-xl font-semibold text-gray-800">FaceAttend</h1>
          </div>
          <div className="flex items-center">
            <span className="mr-3 text-sm font-medium">{user?.name}</span>
            <div className="relative">
              <UserAvatar name={user?.name || ""} className="w-8 h-8" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex-grow flex">
        {/* Sidebar */}
        <aside className="w-56 bg-gray-50 border-r border-gray-200 hidden md:block">
          <nav className="p-4 space-y-1">
            {navItems
              .filter((item) => item.show)
              .map((item) => (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      item.active
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.title}
                  </a>
                </Link>
              ))}

            <Button
              variant="ghost"
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-grow p-4 lg:p-6 overflow-auto">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}