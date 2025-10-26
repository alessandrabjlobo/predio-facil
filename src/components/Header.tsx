import { Menu, Search, Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HeaderProps {
  onToggleCollapse: () => void;
}

export default function Header({ onToggleCollapse }: HeaderProps) {
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      const name = user?.user_metadata?.nome || user?.user_metadata?.name || user?.email?.split("@")[0] || "U";
      setUserName(name);
    });
  }, []);

  const initials = userName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="relative w-80 hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-danger text-[10px] text-white rounded-full flex items-center justify-center">
            3
          </span>
        </Button>

        <Avatar className="h-9 w-9 cursor-pointer">
          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
