export const ADMIN_ROUTES = {
  DASHBOARD: '/admin',
  FUNCTIONS: '/admin/functions',
  PROPERTY_ONBOARDING: '/admin/property-onboarding',
  REQUESTS: '/admin/requests',
  USER_MANAGEMENT: '/admin/user-management'
  ,
  properties: {
    list: '/admin/properties',
    detail: (id: string) => `/admin/properties/${id}`,
  }
} as const;