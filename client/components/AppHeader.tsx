import { useState } from "react";
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
import { User, LogOut, Settings, Shield, Users, Menu, X } from "lucide-react";
import NotificationCenter from "./NotificationCenter";

interface AppHeaderProps {
  title?: string;
  children?: React.ReactNode;
}

export function AppHeader({ title, children }: AppHeaderProps) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleUserManagementClick = () => {
    navigate("/user-management");
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "user":
        return "default";
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
      default:
        return role;
    }
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-3">
        {/* Desktop and Mobile Header */}
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F376e9389c66d473f975258354bf70209%2F9d870cba39fd46d3bb0ed8d14c652440?format=webp&width=800"
              alt="2SND Technologies"
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain flex-shrink-0"
            />
            <h1 className="text-lg sm:text-xl font-bold">
              {title || "Gestion des DAO"}
            </h1>
          </div>

          {/* Center - Custom content (Desktop only) */}
          {children && (
            <div className="hidden lg:flex flex-1 justify-center">
              {children}
            </div>
          )}

          {/* Right side - Always on one line */}
          <div className="flex items-center space-x-2">
            {user && (
              <>
                {/* Notification Center */}
                <NotificationCenter />

                {/* Desktop: User info + Role badge + Menu */}
                <div className="hidden sm:flex items-center space-x-3">
                  {/* User info */}
                  <div className="hidden md:block text-right">
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {user.email}
                    </div>
                  </div>

                  {/* Role badge */}
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {isAdmin() && <Shield className="w-3 h-3 mr-1" />}
                    {getRoleLabel(user.role)}
                  </Badge>

                  {/* Desktop Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <User className="h-4 w-4 mr-2" />
                        Menu
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

                      <DropdownMenuItem onClick={handleProfileClick}>
                        <User className="mr-2 h-4 w-4" />
                        Mon profil
                      </DropdownMenuItem>

                      {isAdmin() && (
                        <>
                          <DropdownMenuItem onClick={handleUserManagementClick}>
                            <Users className="mr-2 h-4 w-4" />
                            Gestion des utilisateurs
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleAdminClick}>
                            <Settings className="mr-2 h-4 w-4" />
                            Administration
                          </DropdownMenuItem>
                        </>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-red-600 focus:text-red-600"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Se déconnecter
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Mobile: Hamburger Menu */}
                <div className="sm:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="relative"
                  >
                    <div className="w-6 h-6 flex items-center justify-center">
                      <div className="relative w-4 h-4">
                        <span
                          className={`absolute h-0.5 w-4 bg-current transition-all duration-300 ease-in-out ${
                            isMobileMenuOpen ? "top-1.5 rotate-45" : "top-0.5"
                          }`}
                        />
                        <span
                          className={`absolute h-0.5 w-4 bg-current transition-all duration-300 ease-in-out top-1.5 ${
                            isMobileMenuOpen ? "opacity-0" : "opacity-100"
                          }`}
                        />
                        <span
                          className={`absolute h-0.5 w-4 bg-current transition-all duration-300 ease-in-out ${
                            isMobileMenuOpen ? "top-1.5 -rotate-45" : "top-2.5"
                          }`}
                        />
                      </div>
                    </div>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
