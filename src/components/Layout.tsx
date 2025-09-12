import { Sidebar } from "./ui/sidebar";
import { Button } from "./ui/button";
import { Home, Building, Users, FileText, Settings, LogOut } from "lucide-react";
import { React } from "react";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

export function Layout({ children, currentPage, onPageChange, onLogout }: LayoutProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'properties', label: 'Properties', icon: Building },
    { id: 'onboarding', label: 'Onboarding', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'admin', label: 'Admin', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 bg-card border-r border-border">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-primary">HouseBook</h1>
          <p className="text-sm text-muted-foreground">Admin Portal</p>
        </div>
        
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={currentPage === item.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => onPageChange(item.id)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
        
        <div className="absolute bottom-4 left-4">
          <Button
            variant="ghost"
            className="justify-start text-destructive hover:text-destructive"
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