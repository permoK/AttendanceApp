import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  className?: string;
  src?: string;
}

export function UserAvatar({ name, className, src }: UserAvatarProps) {
  const initials = getInitials(name);

  return (
    <Avatar className={className}>
      {src ? (
        <img src={src} alt={name} className="object-cover" />
      ) : (
        <AvatarFallback className="bg-primary text-primary-foreground">
          {initials}
        </AvatarFallback>
      )}
    </Avatar>
  );
}