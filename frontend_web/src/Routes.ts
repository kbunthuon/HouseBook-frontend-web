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