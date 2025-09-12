import { useState } from "react";
import { Auth } from "./components/Auth";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { PropertyOnboarding } from "./components/PropertyOnboarding";
import { PropertyManagement } from "./components/PropertyManagement";
import { PropertyDetail } from "./components/PropertyDetail";
import { AdminFunctions } from "./components/AdminFunctions";
import { Reports } from "./components/Reports";

// Owner-specific components
import { OwnerLayout } from "./components/OwnerLayout";
import { OwnerDashboard } from "./components/OwnerDashboard";
import { MyProperties } from "./components/MyProperties";
import { MyReports } from "./components/MyReports";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<'admin' | 'owner'>('owner');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const handleLogin = (email: string, type: 'admin' | 'owner', user_id: string) => {
    setIsAuthenticated(true);
    setUserType(type);
    setUserEmail(email);
    setUserId(user_id)
    // Set appropriate default page based on user type
    setCurrentPage(type === 'admin' ? 'dashboard' : 'owner-dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserType('owner');
    setUserEmail('');
    setCurrentPage('dashboard');
    setSelectedPropertyId(null);
  };

  const handleViewProperty = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setCurrentPage('property-detail');
  };

  const handleBackToProperties = () => {
    setSelectedPropertyId(null);
    setCurrentPage(userType === 'admin' ? 'properties' : 'my-properties');
  };

  const handleAddProperty = () => {
    setCurrentPage(userType === 'admin' ? 'onboarding' : 'add-property');
  };

  // Get user's display name from email
  const getUserName = () => {
    if (!userEmail) return 'User';
    const namePart = userEmail.split('@')[0];
    return namePart.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  };

  // Admin view rendering
  const renderAdminPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'properties':
        return <PropertyManagement onViewProperty={handleViewProperty} />;
      case 'property-detail':
        return selectedPropertyId ? (
          <PropertyDetail 
            propertyId={selectedPropertyId} 
            onBack={handleBackToProperties}
          />
        ) : (
          <PropertyManagement onViewProperty={handleViewProperty} />
        );
      case 'onboarding':
        return <PropertyOnboarding />;
      case 'reports':
        return <Reports />;
      case 'admin':
        return <AdminFunctions />;
      default:
        return <Dashboard />;
    }
  };

  // Owner view rendering
  const renderOwnerPage = () => {
    switch (currentPage) {
      case 'owner-dashboard':
        return <OwnerDashboard 
        userId={userId} 
        ownerName={getUserName()}/>;
      case 'my-properties':
        return <MyProperties 
          ownerEmail={userId} 
          onViewProperty={handleViewProperty}
          onAddProperty={handleAddProperty}
        />;
      case 'property-detail':
        return selectedPropertyId ? (
          <PropertyDetail 
            propertyId={selectedPropertyId} 
            onBack={handleBackToProperties}
          />
        ) : (
          <MyProperties 
            ownerEmail={userId} 
            onViewProperty={handleViewProperty}
            onAddProperty={handleAddProperty}
          />
        );
      case 'add-property':
        return <PropertyOnboarding />;
      case 'my-reports':
        return <MyReports ownerEmail={userEmail} />;
      default:
        return <OwnerDashboard userId={userEmail} ownerName={getUserName()} />;
    }
  };

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  // Render different layouts based on user type
  if (userType === 'admin') {
    return (
      <Layout
        currentPage={currentPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          setSelectedPropertyId(null);
        }}
        onLogout={handleLogout}
      >
        {renderAdminPage()}
      </Layout>
    );
  } else {
    return (
      <OwnerLayout
        currentPage={currentPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          setSelectedPropertyId(null);
        }}
        onLogout={handleLogout}
        ownerName={getUserName()}
      >
        {renderOwnerPage()}
      </OwnerLayout>
    );
  }
}