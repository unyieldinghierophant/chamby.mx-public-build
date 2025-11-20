export const ROUTES = {
  HOME: '/',
  BOOK_JOB: '/book-job',
  USER_LANDING: '/user-landing',
  USER_AUTH: '/auth/user',
  TASKER_AUTH: '/auth/tasker',
  PROVIDER_PORTAL: '/provider-portal',
  PROVIDER_DASHBOARD: '/provider-portal/dashboard',
  PROVIDER_JOBS: '/provider-portal/jobs',
  PROVIDER_CALENDAR: '/provider-portal/calendar',
  PROVIDER_PROFILE: '/provider-portal/profile',
  PROVIDER_NOTIFICATIONS: '/provider-portal/notifications',
  BECOME_PROVIDER: '/become-provider',
  PROFILE_SETTINGS: '/profile-settings',
  SECURITY_SETTINGS: '/security-settings',
  SAVED_LOCATIONS: '/saved-locations',
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
