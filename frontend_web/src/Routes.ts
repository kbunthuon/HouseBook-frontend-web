export const ROUTES = {
  dashboard: "/owner",
  properties: {
    list: "/owner/properties",
    add: "/owner/properties/new",
    pattern: "properties/:propertyId",
    detail: (id: string) => `/owner/properties/${id}`,
  },
  reports: "/owner/reports",
  requests: "/owner/requests",
};

export const DASHBOARD = "dashboard";

export const ADMIN_ROUTES = {
  dashboard: "/admin",
  properties: {
    list: "/admin/properties",
    add: "/admin/properties/new",
    pattern: "properties/:propertyId",
    detail: (id: string) => `/admin/properties/${id}`,
  },
  reports: "/admin/reports",
  adminTools: "/admin/admin-tools",
};

export const LOGIN = "/login";
export const SIGNUP = "/signup";