/** Process lock to prevent multiple instances */
import { writeFile, unlink, access, readFile, constants } from 'fs/promises';
import { existsSync } from 'fs';

export class Lock {
  private file: string;

  constructor(file = '.qwen-forge.lock') {
    this.file = file;
  }

  async acquire(): Promise<boolean> {
    if (await this.isLocked()) {
      if (!(await this.isProcessAlive())) await this.release();
      else return false;
    }
    try {
      await writeFile(this.file, String(process.pid), 'utf-8');
      return true;
    } catch { return false; }
  }

  async release(): Promise<void> {
    try {
      if (existsSync(this.file)) await unlink(this.file);
    } catch {}
  }

  private async isLocked(): Promise<boolean> {
    try { await access(this.file, constants.F_OK); return true; }
    catch { return false; }
  }

  private async isProcessAlive(): Promise<boolean> {
    try {
      const pid = parseInt((await readFile(this.file, 'utf-8')).trim(), 10);
      if (isNaN(pid)) return false;
      try { process.kill(pid, 0); return true; }
      catch (e: any) {
        if (e.code === 'ESRCH') return false;
        if (e.code === 'EPERM') return true;
        return false;
      }
    } catch { return false; }
  }
}
