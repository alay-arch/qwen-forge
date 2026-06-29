/** JSON file storage with atomic writes */
import { readFile, writeFile, mkdir, rename } from 'fs/promises';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';
import type { Account, AccountSummary, AccountStatus } from '../types.js';
import { safeJsonParse } from '../cli/helpers.js';

export class Storage {
  private filePath: string;
  private accounts: Account[] = [];
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(dir: string) {
    this.filePath = join(dir, 'accounts.json');
  }

  async init(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await this.load();
  }

  private async load(): Promise<void> {
    try {
      const content = await readFile(this.filePath, 'utf-8');
      const parsed = safeJsonParse<Account[]>(content, []);
      this.accounts = Array.isArray(parsed) ? parsed : [];
    } catch { this.accounts = []; }
  }

  private async save(): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      const tmp = `${this.filePath}.tmp`;
      await mkdir(dirname(this.filePath), { recursive: true });
      await writeFile(tmp, JSON.stringify(this.accounts, null, 2), 'utf-8');
      await rename(tmp, this.filePath);
    });
    await this.writeQueue;
  }

  async saveAccount(account: Account): Promise<void> {
    const idx = this.accounts.findIndex(a => a.id === account.id);
    if (idx >= 0) this.accounts[idx] = account;
    else this.accounts.push(account);
    await this.save();
  }

  async getAccount(id: string): Promise<Account | null> {
    return this.accounts.find(a => a.id === id) || null;
  }

  async getByEmail(email: string): Promise<Account | null> {
    return this.accounts.find(a => a.email === email) || null;
  }

  async getAll(): Promise<Account[]> {
    return [...this.accounts];
  }

  async getByStatus(status: AccountStatus): Promise<Account[]> {
    return this.accounts.filter(a => a.status === status);
  }

  async updateStatus(id: string, status: AccountStatus): Promise<void> {
    const a = this.accounts.find(a => a.id === id);
    if (a) { a.status = status; a.updatedAt = new Date().toISOString(); await this.save(); }
  }

  async delete(id: string): Promise<void> {
    this.accounts = this.accounts.filter(a => a.id !== id);
    await this.save();
  }

  async summary(): Promise<AccountSummary> {
    const total = this.accounts.length;
    const success = this.accounts.filter(a => a.status === 'SUCCESS').length;
    const failed = total - success;
    return {
      total,
      success,
      failed,
      successRate: total > 0 ? (success / total) * 100 : 0,
      lastCreated: this.accounts.length > 0 ? this.accounts[this.accounts.length - 1].createdAt : undefined,
    };
  }

  async close(): Promise<void> {
    await this.save();
  }

  static create(email: string, password: string, status: AccountStatus = 'SUCCESS'): Account {
    const now = new Date().toISOString();
    return { id: randomUUID(), email, password, status, createdAt: now, updatedAt: now };
  }
}
