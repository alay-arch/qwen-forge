/** Consolidated type definitions */

export type Language = 'ru' | 'en';
export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'FATAL';
export type LogOutputMode = 'silent' | 'normal' | 'debug' | 'trace';
export type AccountStatus =
  | 'SUCCESS'
  | 'SUBMIT_FAILED'
  | 'NO_MAIL'
  | 'ACTIVATION_FAILED'
  | 'USER_SKIPPED'
  | 'NETWORK_ERROR'
  | 'LOGOUT_FAILED';

export interface AppConfig {
  version: string;
  server: { port: number };
  browser: { profileDir: string; timeout: number };
  mail: { apiUrl: string; domain: string; timeout: number };
  qwen: { baseUrl: string };
  storage: { dir: string };
  logger: { file: string };
  cli: { language: Language; firstRun: boolean };
}

export interface Account {
  id: string;
  email: string;
  password: string;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AccountSummary {
  total: number;
  success: number;
  failed: number;
  successRate: number;
  lastCreated?: string;
}

export interface SessionAccount {
  email: string;
  password: string;
  status: AccountStatus;
  createdAt: string;
  duration?: number;
  error?: string;
}

export interface BrowserConfig {
  headless: boolean;
  humanize: boolean;
  geoip: boolean;
  userDataDir: string;
  args: string[];
  timeout: number;
}

export interface BrowserState {
  isRunning: boolean;
  isBusy: boolean;
  activeTabs: number;
  uptime: number;
  profilePath: string;
}

export interface RegistrationResult {
  success: boolean;
  email: string;
  submitted: boolean;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface LogoutResult {
  success: boolean;
  signedOut: boolean;
  cookiesCleared: boolean;
  storageCleared: boolean;
  tabsClosed: boolean;
  verified: boolean;
  error?: string;
}

export type EventType =
  | 'browser:started'
  | 'browser:stopped'
  | 'browser:error'
  | 'registration:started'
  | 'registration:completed'
  | 'registration:failed'
  | 'logout:started'
  | 'logout:completed'
  | 'logout:failed'
  | 'server:started'
  | 'server:stopped'
  | 'server:error';

