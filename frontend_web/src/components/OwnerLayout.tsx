import { Button } from "./ui/button";
import { Home, Building, FileText, Plus, LogOut, UserPen } from "lucide-react";
import { NavLink, Outlet, Routes, useLocation } from "react-router-dom";
import { ROUTES } from "../Routes";

interface OwnerLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  ownerName: string;
}

export function OwnerLayout({ children, currentPage, onPageChange, onLogout, ownerName }: OwnerLayoutProps) {
  const location = useLocation();

  const menu = [
    { to: ROUTES.dashboard, label: "My Dashboard", icon: Home, end: true },
    { to: ROUTES.properties.list, label: "My Properties", icon: Building, },
    { to: ROUTES.properties.add, label: "Add Property", icon: Plus, end: true },
    { to: ROUTES.reports, label: "Reports", icon: FileText, end: false },
    { to: ROUTES.requests, label: "Requests", icon: UserPen, end: true },
  ];

   return (
    <div className="flex h-screen bg-background">
      <div className="w-64 bg-card border-r border-border">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-primary">HouseBook</h1>
          <p className="text-sm text-muted-foreground">Property Owner Portal</p>
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">Welcome back,</p>
            <p className="font-medium">{ownerName}</p>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {menu.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={() => {
                // Custom highlight logic for "My Properties": Highlight for all sub-routes EXCEPT "Add Property"
                if (label === "My Properties") {
                  return location.pathname.startsWith(ROUTES.properties.list) &&
                    location.pathname !== ROUTES.properties.add
                    ? "block w-full rounded-md px-3 py-2 text-left flex items-center bg-secondary text-secondary-foreground"
                    : "block w-full rounded-md px-3 py-2 text-left flex items-center hover:bg-accent";
                }

                // Default behavior
                const isActive = location.pathname === to;
                return `block w-full rounded-md px-3 py-2 text-left flex items-center ${
                  isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-accent"
                }`;
              }}
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
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}