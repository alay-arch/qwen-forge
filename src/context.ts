/** Shared application context type — imported by all services.
 *
 * Break the circular dependency: index.ts imports from services,
 * services import the context type from here.
 */
import type { AppConfig } from './types.js';
import type { BrowserManager } from './browser/manager.js';
import type { RegistrationService } from './services/registration.js';
import type { LogoutService } from './services/logout.js';
import type { AccountService } from './services/account.js';
import type { SessionAccountsManager } from './services/session.js';
import type { ConfigManager } from './config/manager.js';
import type { Logger } from './utils/logger.js';
import type { EventBus } from './utils/eventbus.js';
import type { Storage } from './storage/json.js';
import type { Server } from './server/http.js';

export interface AppContext {
  config: AppConfig;
  configManager: ConfigManager;
  logger: Logger;
  eventBus: EventBus;
  storage: Storage;
  browserManager: BrowserManager;
  registrationService: RegistrationService;
  logoutService: LogoutService;
  accountService: AccountService;
  httpServer: Server;
  sessionAccountsManager: SessionAccountsManager;
}
