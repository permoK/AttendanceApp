import { cn } from "@/lib/utils";

type StatusVariant = "active" | "inactive" | "present" | "absent";

interface StatusBadgeProps {
  variant: StatusVariant;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  const baseStyles = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
  
  const variantStyles = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-200 text-gray-600", 
    present: "bg-green-100 text-green-800",
    absent: "bg-red-100 text-red-800",
  };
  
  return (
    <span className={cn(baseStyles, variantStyles[variant], className)}>
      {children}
    </span>
  );
}
