import { Sidebar } from "./ui/sidebar";
import { Button } from "./ui/button";
import { Home, Building, Users, FileText, Settings, LogOut, UserPen } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ADMIN_ROUTES } from "../Routes";
interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

export function Layout({ children, currentPage, onPageChange, onLogout }: LayoutProps) {
  const menuItems = [
    { to: ADMIN_ROUTES.dashboard, label: "Dashboard", icon: Home, end: true },
    { to: ADMIN_ROUTES.properties.list, label: "Properties", icon: Building, end: true },
    { to: ADMIN_ROUTES.properties.add, label: "Onboarding", icon: Users },
    { to: ADMIN_ROUTES.reports, label: "Reports", icon: FileText },
    { to: ADMIN_ROUTES.adminTools, label: "Admin", icon: Settings },
    { to: ADMIN_ROUTES.requests, label: "Requests", icon: UserPen, end: true },
    { to: ADMIN_ROUTES.users, label: "User Management", icon: UserPen, end: true }
  ];



  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 sm:w-56 md:w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-primary">HouseBook</h1>
          <p className="text-sm text-muted-foreground">Admin Portal</p>
        </div>
        
        <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2">
          {menuItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `block w-full rounded-md px-3 py-2 text-left flex items-center
                  ${isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-accent"}`
                }
              >
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </NavLink>
            ))}
        </nav>
        
        <div className="absolute bottom-4 left-4">
          <Button
            variant="ghost"
            className="justify-start text-destructive hover:text-destructive !important"
            onClick={onLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}