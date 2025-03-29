import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  className?: string;
}

export function UserAvatar({ name, className }: UserAvatarProps) {
  const initials = getInitials(name);
  
  return (
    <Avatar className={className}>
      <AvatarFallback className="bg-primary text-white">{initials}</AvatarFallback>
    </Avatar>
  );
}
