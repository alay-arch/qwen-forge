/** Account service — CRUD operations */
import type { Account, AccountStatus, AccountSummary } from '../types.js';
import { Storage } from '../storage/json.js';
import { Logger } from '../utils/logger.js';

export class AccountService {
  constructor(private storage: Storage, private logger: Logger) {}

  async create(email: string, password: string, status: AccountStatus = 'SUCCESS'): Promise<Account> {
    const a = Storage.create(email, password, status);
    await this.storage.saveAccount(a);
    this.logger.debug(`Account created: ${email}`, { status });
    return a;
  }

  async save(account: Account): Promise<void> {
    await this.storage.saveAccount(account);
  }

  async get(id: string): Promise<Account | null> {
    return this.storage.getAccount(id);
  }

  async getByEmail(email: string): Promise<Account | null> {
    return this.storage.getByEmail(email);
  }

  async getAll(): Promise<Account[]> {
    return this.storage.getAll();
  }

  async getByStatus(status: AccountStatus): Promise<Account[]> {
    return this.storage.getByStatus(status);
  }

  async updateStatus(id: string, status: AccountStatus): Promise<void> {
    await this.storage.updateStatus(id, status);
  }

  async delete(id: string): Promise<void> {
    await this.storage.delete(id);
  }

  async summary(): Promise<AccountSummary> {
    return this.storage.summary();
  }

  async recentSuccess(limit = 5): Promise<Account[]> {
    const accounts = await this.storage.getByStatus('SUCCESS');
    return accounts.slice(-limit);
  }

  async createFromResult(email: string, password: string, success: boolean, reason?: string): Promise<Account> {
    const status: AccountStatus = success ? 'SUCCESS' : this.mapFailure(reason);
    const a = Storage.create(email, password, status);
    await this.storage.saveAccount(a);
    this.logger.info(`Account from registration: ${email}`, { status });
    return a;
  }

  private mapFailure(reason?: string): AccountStatus {
    switch (reason) {
      case 'SUBMIT_FAILED': return 'SUBMIT_FAILED';
      case 'NO_MAIL': return 'NO_MAIL';
      case 'ACTIVATION_FAILED': return 'ACTIVATION_FAILED';
      case 'USER_SKIPPED': return 'USER_SKIPPED';
      case 'NETWORK_ERROR': return 'NETWORK_ERROR';
      case 'LOGOUT_FAILED': return 'LOGOUT_FAILED';
      default: return 'SUBMIT_FAILED';
    }
  }
}
