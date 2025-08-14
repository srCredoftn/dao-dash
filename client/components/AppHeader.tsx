import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, Settings, Shield } from "lucide-react";
import NotificationCenter from "./NotificationCenter";

interface AppHeaderProps {
  title?: string;
  children?: React.ReactNode;
}

export function AppHeader({ title, children }: AppHeaderProps) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleAdminClick = () => {
    navigate("/admin/users");
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "user":
        return "default";
      case "viewer":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrateur";
      case "user":
        return "Utilisateur";
      case "viewer":
        return "Visualiseur";
      default:
        return role;
    }
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          {/* Left side - Logo and title */}
          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
            <div className="flex items-center space-x-3">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F376e9389c66d473f975258354bf70209%2F9d870cba39fd46d3bb0ed8d14c652440?format=webp&width=800"
                alt="2SND Technologies"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0"
              />
              <h1 className="text-lg sm:text-xl font-bold truncate">
                {title || "Gestion des DAO"}
              </h1>
            </div>
          </div>

          {/* Center - Custom content */}
          {children && (
            <div className="flex-1 flex justify-center">{children}</div>
          )}

          {/* Right side - User menu */}
          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-end">
            {user && (
              <>
                {/* Notification Center */}
                <NotificationCenter />
                {/* User info */}
                <div className="hidden md:block text-right">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {user.email}
                  </div>
                </div>

                {/* Role badge */}
                <Badge
                  variant={getRoleBadgeVariant(user.role)}
                  className="hidden sm:flex"
                >
                  {isAdmin() && <Shield className="w-3 h-3 mr-1" />}
                  <span className="hidden sm:inline">
                    {getRoleLabel(user.role)}
                  </span>
                </Badge>

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0"
                    >
                      <User className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-sm">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                      <Badge
                        variant={getRoleBadgeVariant(user.role)}
                        className="mt-1 text-xs"
                      >
                        {getRoleLabel(user.role)}
                      </Badge>
                    </div>
                    <DropdownMenuSeparator />

                    {isAdmin() && (
                      <>
                        <DropdownMenuItem onClick={handleAdminClick}>
                          <Settings className="mr-2 h-4 w-4" />
                          Administration
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Se déconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
