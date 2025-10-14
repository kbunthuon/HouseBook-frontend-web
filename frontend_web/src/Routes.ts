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

  propertyTransfer: "/owner/property-transfer/:id",
  propertyTransferPath: (id: string) => `/owner/property-transfer/${id}`,

  propertyTransferSubmitted: "/owner/property-transfer/:id/submitted",
  propertyTransferSubmittedPath: (id: string) => `/owner/property-transfer/${id}/submitted`,
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