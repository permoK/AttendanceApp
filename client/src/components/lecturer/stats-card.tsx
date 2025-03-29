import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  BookOpen, 
  Users, 
  Clock, 
  CheckCircle,
  BookOpenCheck,
  UserCheck,
  Activity,
  CalendarClock
} from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: "courses" | "students" | "active" | "attendance";
  className?: string;
}

export function StatsCard({ title, value, icon, className }: StatsCardProps) {
  const icons = {
    courses: { component: BookOpen, color: "bg-primary bg-opacity-10 text-primary" },
    students: { component: Users, color: "bg-teal-100 text-teal-600" },
    active: { component: Clock, color: "bg-amber-100 text-amber-600" },
    attendance: { component: CheckCircle, color: "bg-green-100 text-green-600" },
  };
  
  const IconComponent = icons[icon].component;
  const iconColor = icons[icon].color;
  
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 p-3 rounded-full", iconColor)}>
            <IconComponent className="h-5 w-5" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-gray-800">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
