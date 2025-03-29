import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  ClipboardList, 
  Settings 
} from "lucide-react";
import { useLocation } from "wouter";

export function LecturerSidebar() {
  const [location, navigate] = useLocation();

  // Define sidebar menu items
  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/lecturer",
      active: location === "/lecturer"
    },
    {
      title: "Courses",
      icon: BookOpen,
      path: "/lecturer/courses",
      active: location === "/lecturer/courses"
    },
    {
      title: "Students",
      icon: GraduationCap,
      path: "/lecturer/students",
      active: location === "/lecturer/students"
    },
    {
      title: "Attendance",
      icon: ClipboardList,
      path: "/lecturer/attendance",
      active: location === "/lecturer/attendance"
    },
    {
      title: "Settings",
      icon: Settings,
      path: "/lecturer/settings",
      active: location === "/lecturer/settings"
    }
  ];

  return (
    <aside className="hidden md:block w-64 bg-white border-r border-gray-200 p-4">
      <nav className="mt-4">
        <ul>
          {menuItems.map((item, index) => (
            <li key={index} className="mb-1">
              <button
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex items-center w-full px-4 py-2 rounded-md transition-colors",
                  item.active
                    ? "bg-primary-light bg-opacity-10 text-primary font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span>{item.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
