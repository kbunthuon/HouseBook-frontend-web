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
import { Toaster } from "sonner";

import { Auth } from "./components/Auth";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { OwnerPropertyOnboarding } from "./components/OwnerPropertyOnboarding";
import { AdminPropertyOnboarding } from "./components/AdminPropertyOnboarding";
import { PropertyManagement } from "./components/PropertyManagement";
import { PropertyDetail } from "./components/PropertyDetail";
import { AdminFunctions } from "./components/AdminFunctions";
import { Reports } from "./components/Reports";
import { AdminRequests } from "./components/AdminRequests";
import { UserManagementPage } from "./components/UserManagement";

// Owner-specific components
import { OwnerLayout } from "./components/OwnerLayout";
import { OwnerDashboard } from "./components/OwnerDashboard";
import { MyProperties } from "./components/MyProperties";
import { MyReports } from "./components/MyReports";
import { OwnerRequests } from "./components/OwnerRequests";

import { ROUTES, DASHBOARD, ADMIN_ROUTES, LOGIN, SIGNUP } from "./Routes"

import { FormProvider, AdminFormProvider } from "./components/FormContext";

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
    <Toaster position="top-right" />
      <Routes>
        {/* Default: send to role home if logged in, else to login */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={userType === "admin" ? "/admin" : "/owner"} replace />
            ) : (
              <Navigate to={LOGIN} replace />
            )
          }
        />
        {/* Login route */}
        <Route
          path={LOGIN}
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
          path={ADMIN_ROUTES.dashboard}
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireRole userType={userType} role="admin">
                <AdminFormProvider>
                  <Layout
                    onLogout={handleLogout}
                    currentPage={DASHBOARD}
                    onPageChange={() => {}}
                  >
                    <Outlet />
                  </Layout>
                </AdminFormProvider>
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage userId={userId} userType={userType} />} />
          <Route path={ADMIN_ROUTES.properties.list} element={<AdminPropertiesPage />} />
          <Route path={ADMIN_ROUTES.properties.add} element={<AdminPropertyOnboarding />} />
          <Route path={ADMIN_ROUTES.properties.pattern} element={<AdminPropertyDetailPage />} />
          <Route path={ADMIN_ROUTES.reports} element={<Reports />} />
          <Route path={ADMIN_ROUTES.adminTools} element={<AdminFunctions />} />
          <Route path={ADMIN_ROUTES.requests} element={<AdminRequests userId={userId} userType={userType} />} />
          <Route path={ADMIN_ROUTES.users} element={<UserManagementPage />} />


        </Route>
        {/* OWNER AREA */}
        <Route
          path={ROUTES.dashboard}
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireRole userType={userType} role="owner">
                <FormProvider>
                  <OwnerLayout
                    onLogout={handleLogout}
                    ownerName={getUserName()}
                    currentPage={DASHBOARD}
                    onPageChange={() => {}}
                  >
                    <Outlet />
                  </OwnerLayout>
                </FormProvider>
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route index element={<OwnerDashboardPage userId={userId} />} />
          <Route path={ROUTES.properties.list} element={<OwnerPropertiesPage userId={userId} userEmail={userEmail} />} />
          <Route path={ROUTES.properties.add} element={<OwnerPropertyOnboarding />} />
          <Route path={ROUTES.properties.pattern} element={<OwnerPropertyDetailPage />} />
          <Route path={ROUTES.reports} element={<MyReports ownerEmail={userEmail} />} />
          <Route path={ROUTES.requests} element={<OwnerRequests userId={userId}/>} />
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
  if (!isAuthenticated) return <Navigate to={LOGIN} replace />;
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
function DashboardPage({ userId, userType}: { userId: string, userType: string }) {
  const navigate = useNavigate();

  return (
    <Dashboard
      userId={userId}
      userType={userType}
      onViewProperty={(id: string) => navigate(ADMIN_ROUTES.properties.detail(id))}
      onAddProperty={() => navigate(ADMIN_ROUTES.properties.add)}
    />
  );
}

function AdminPropertiesPage() {
  const navigate = useNavigate();
  return (
    <PropertyManagement
      onViewProperty={(id: string) => navigate(ADMIN_ROUTES.properties.detail(id))}
    />
  );
}

function AdminPropertyDetailPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  return (
    <PropertyDetail
      propertyId={propertyId!}
      onBack={() => navigate(ADMIN_ROUTES.properties.list)}
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
      onViewProperty={(id: string) => navigate(ROUTES.properties.detail(id))}
      onAddProperty={() => navigate(ROUTES.properties.add)}
    />
  );
}

function OwnerPropertyDetailPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  return (
    <PropertyDetail
      propertyId={propertyId!}
      onBack={() => navigate(ROUTES.properties.list)}
    />
  );
}

function OwnerDashboardPage({ userId }: { userId: string }) {
  const navigate = useNavigate();

  return (
    <OwnerDashboard
      userId={userId}
      onViewProperty={(id: string) => navigate(ROUTES.properties.detail(id))}
      onAddProperty={() => navigate(ROUTES.properties.add)}
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
