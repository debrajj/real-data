export enum AppView {
  WELCOME = 'WELCOME',
  LOGIN = 'LOGIN', // Session-based login with Shopify credentials
  CONFIGURATION = 'CONFIGURATION',
  SYNC_SUCCESS = 'SYNC_SUCCESS',
  DASHBOARD = 'DASHBOARD', // The main admin layout
}

export enum DashboardTab {
  OVERVIEW = 'OVERVIEW',
  PREVIEW = 'PREVIEW',
  BUILD_MANAGER = 'BUILD_MANAGER',
  SETTINGS = 'SETTINGS',
  THEME_SYNC = 'THEME_SYNC',
  TICKETS = 'TICKETS',
  SUPPORT = 'SUPPORT'
}

export enum AppEnvironment {
  DEV = 'Development',
  PROD = 'Production'
}

export enum Platform {
  ANDROID = 'Android',
  IOS = 'iOS'
}

export enum BuildStatus {
  QUEUED = 'Queued',
  BUILDING = 'Building',
  COMPLETED = 'Completed',
  FAILED = 'Failed'
}

export interface BuildJob {
  id: string;
  version: string;
  platform: Platform;
  environment: AppEnvironment;
  status: BuildStatus;
  progress: number; // 0-100
  startedAt: Date;
  downloadUrl?: string;
}

export interface AppConfig {
  clientName: string;
  clientKey: string;
  shopDomain?: string; // Shopify store domain (e.g., yourstore.myshopify.com)
  apiBaseUrl: string;
  adminApiBaseUrl: string;
  appName: string;
  primaryColor: string;
  bundleId: string;
  packageName: string;
  logoUrl: string;
  environment: AppEnvironment;
  storefrontToken: string;
  adminShopToken: string;
  databaseName?: string; // Database name for this client
  isActive?: boolean; // Whether this config is active
}

export interface ThemeSyncLog {
  id: string;
  timestamp: Date;
  status: 'Success' | 'Failed';
  changes: string;
}

export interface Ticket {
  id: string;
  subject: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  createdAt: Date;
  lastUpdate: Date;
}