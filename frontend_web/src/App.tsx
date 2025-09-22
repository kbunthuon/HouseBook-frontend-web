import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
  useParams,
} from "react-router-dom";

import { Auth } from "./components/Auth";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { OwnerPropertyOnboarding } from "./components/OwnerPropertyOnboarding";
import { AdminPropertyOnboarding } from "./components/AdminPropertyOnboarding";
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
  const [userType, setUserType] = useState<"admin" | "owner">("owner");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");

  const handleLogin = (email: string, type: "admin" | "owner", user_id: string) => {
    setIsAuthenticated(true);
    setUserType(type);
    setUserEmail(email);
    setUserId(user_id);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserType("owner");
    setUserEmail("");
    setUserId("");
  };

  {/*
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
  }; */}

  // Get user's display name from email
  const getUserName = () => {
    if (!userEmail) return "User";
    const namePart = userEmail.split("@")[0];
    return namePart
      .split(".")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Default: send to role home if logged in, else to login */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={userType === "admin" ? "/admin" : "/owner"} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Login route */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={userType === "admin" ? "/admin" : "/owner"} replace />
            ) : (
              <Auth onLogin={handleLogin} />
            )
          }
        />

        {/* ADMIN AREA */}
        <Route
          path="/admin"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireRole userType={userType} role="admin">
                <Layout
                  onLogout={handleLogout}
                  currentPage="dashboard"
                  onPageChange={() => {}}
                >
                  <Outlet />
                </Layout>
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="properties" element={<AdminPropertiesPage />} />
          <Route path="properties/new" element={<AdminPropertyOnboarding />} />
          <Route path="properties/:propertyId" element={<AdminPropertyDetailPage />} />
          <Route path="reports" element={<Reports />} />
          <Route path="admin-tools" element={<AdminFunctions />} />
        </Route>

        {/* OWNER AREA */}
        <Route
          path="/owner"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireRole userType={userType} role="owner">
                <OwnerLayout
                  onLogout={handleLogout}
                  ownerName={getUserName()}
                  currentPage="dashboard"
                  onPageChange={() => {}}
                >
                  <Outlet />
                </OwnerLayout>
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route index element={<OwnerDashboardPage userId={userId} />} />
          <Route path="properties" element={<OwnerPropertiesPage userId={userId} userEmail={userEmail} />} />
          <Route path="properties/new" element={<OwnerPropertyOnboarding />} />
          <Route path="properties/:propertyId" element={<OwnerPropertyDetailPage />} />
          <Route path="reports" element={<MyReports ownerEmail={userEmail} />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

/** ---------- Route Guards ---------- */
function RequireAuth({
  isAuthenticated,
  children,
}: {
  isAuthenticated: boolean;
  children: React.ReactNode;
}) {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRole({
  userType,
  role,
  children,
}: {
  userType: "admin" | "owner";
  role: "admin" | "owner";
  children: React.ReactNode;
}) {
  if (userType !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** ---------- Admin nested helpers ---------- */
function AdminPropertiesPage() {
  const navigate = useNavigate();
  return (
    <PropertyManagement
      onViewProperty={(id: string) => navigate(`/admin/properties/${id}`)}
    />
  );
}

function AdminPropertyDetailPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  return (
    <PropertyDetail
      propertyId={propertyId!}
      onBack={() => navigate("/admin/properties")}
    />
  );
}

/** ---------- Owner nested helpers ---------- */
function OwnerPropertiesPage({ userId, userEmail }: { userId: string; userEmail: string }) {
  const navigate = useNavigate();
  // NOTE: you previously passed userId as ownerEmail; keep whichever your component expects.
  return (
    <MyProperties
      ownerEmail={userId /* or userEmail if that's correct */}
      onViewProperty={(id: string) => navigate(`/owner/properties/${id}`)}
      onAddProperty={() => navigate("/owner/properties/new")}
    />
  );
}

function OwnerPropertyDetailPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  return (
    <PropertyDetail
      propertyId={propertyId!}
      onBack={() => navigate("/owner/properties")}
    />
  );
}

function OwnerDashboardPage({ userId }: { userId: string }) {
  const navigate = useNavigate();

  return (
    <OwnerDashboard
      userId={userId}
      onAddProperty={() => navigate("/owner/properties/new")}
    />
  );
}


/** ---------- 404 ---------- */
function NotFound() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <a className="underline" href="/">Go home</a>
    </div>
  );
}
