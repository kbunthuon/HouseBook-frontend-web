import { useState, useEffect } from "react";
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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { Auth } from "./components/Auth";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { OwnerPropertyOnboarding } from "./components/OwnerPropertyOnboarding";
import { AdminPropertyOnboarding } from "./components/AdminPropertyOnboarding";
import { PropertyManagement } from "./components/PropertyManagement";
import { PropertyDetail } from "./components/PropertyDetail";
import { AdminFunctions } from "./components/AdminFunctions";
import { Reports } from "./components/Reports";
import TransferRequestPage from "./components/TransferRequestPage";
import TransferSubmittedPage from "./components/TransferSubmittedPage";

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
import { apiClient } from "./api/wrappers";

// Create a React Query client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // Cache persists for 10 minutes
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      retry: 1, // Retry failed requests once
    },
  },
});
// Main func
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

const handleLogout = async () => {
  try {
    // 1. Clear React Query cache
    queryClient.clear();
    
    // 2. Logout from backend (clears sessionStorage and Supabase session)
    await apiClient.logout();

    // 3. Clear local state
    setIsAuthenticated(false);
    setUserType("owner");
    setUserEmail("");
    setUserId("");
    
    // Note: Navigation will happen automatically due to state change
    // The RequireAuth guard will redirect to /login when isAuthenticated becomes false
  } catch (error) {
    console.error("Logout failed:", error);
    
    // Still clear everything even if logout fails
    queryClient.clear();
    setIsAuthenticated(false);
    setUserType("owner");
    setUserEmail("");
    setUserId("");
  }
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

  // Add cleanup on page unload/close
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Optional: Only logout if user wants session to end on browser close
      // For now, we'll just ensure any pending operations are completed
      // You can uncomment the lines below to force logout on page close

      // Note: This will NOT work reliably due to browser restrictions
      // Modern browsers don't allow async operations in beforeunload
      // But we can at least clear localStorage synchronously

      // Uncomment to force session clear on browser close:
      // localStorage.clear();
    };

    const handleVisibilityChange = () => {
      // When the page becomes hidden (tab switch, minimize, etc.)
      // we don't want to logout, but we can log for debugging
      if (document.hidden) {
        console.log('Page hidden - session maintained');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
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
          <Route path={ADMIN_ROUTES.properties.list} element={<AdminPropertiesPage userId={userId} userType={userType}/>} />
          <Route path={ADMIN_ROUTES.properties.add} element={<AdminPropertyOnboarding />} />
          <Route path={ADMIN_ROUTES.properties.pattern} element={<AdminPropertyDetailPage />} />
          <Route path={ADMIN_ROUTES.reports} element={<Reports userId={userId} userType={userType}/>} />
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
          <Route path={ROUTES.properties.list} element={<OwnerPropertiesPage userId={userId} />} />
          <Route path={ROUTES.properties.add} element={<OwnerPropertyOnboarding userId={userId} />} />
          <Route path={ROUTES.properties.pattern} element={<OwnerPropertyDetailPage />} />
          <Route path={ROUTES.reports} element={<MyReports ownerEmail={userEmail} />} />
          <Route path={ROUTES.requests} element={<OwnerRequests userId={userId}/>} />
          <Route path={ROUTES.propertyTransfer} element={<TransferRequestRoute userId={userId} />} />
          <Route path={ROUTES.propertyTransferSubmitted} element={<TransferSubmittedPage />} />
          {/* <Route path={ROUTES.reports} element={<MyReports userId={userId} />} />
          <Route path={ROUTES.requests} element={<OwnerRequests />} /> */}
        </Route>
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {/* React Query DevTools - only visible in development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </BrowserRouter>
    </QueryClientProvider>
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

function AdminPropertiesPage({ userId, userType}: { userId: string, userType:string}) {
  const navigate = useNavigate();
  return (
    <PropertyManagement
      userId={userId}
      userType={userType}
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
function OwnerPropertiesPage({ userId }: { userId: string }) {
  const navigate = useNavigate();
  return (
    <MyProperties
      ownerId={userId}
      onViewProperty={(id: string) => navigate(ROUTES.properties.detail(id))}
      onAddProperty={() => navigate(ROUTES.properties.add)}
    />
  );
}

function OwnerPropertyDetailPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();

  console.log('OwnerPropertyDetailPage rendered');
  console.log('propertyId from useParams:', propertyId);
  console.log('All params:', useParams());
  console.log('Current location:', window.location.pathname);
  
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

function TransferRequestRoute({ userId }: { userId: string }) {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return (
    <TransferRequestPage
      propertyId={id}
      userId={userId}
      onViewTransfer={(pid) => navigate(ROUTES.propertyTransferPath(pid))} // use the *builder*
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
