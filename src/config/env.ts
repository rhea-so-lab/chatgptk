import { EnvKey, EnvSafe } from '@creatrip/env-safe';
import fs from 'fs';
import path from 'path';

const envPath = path.join(__dirname, '..', '..', '.env');

@EnvSafe({ path: envPath })
export class Env {
  @EnvKey({ nullable: true })
  public static OPENAI_API_KEY?: string;

  public static save(input: { OPENAI_API_KEY: string }) {
    this.OPENAI_API_KEY = input.OPENAI_API_KEY;
    fs.writeFileSync(envPath, `OPENAI_API_KEY="${this.OPENAI_API_KEY}"`);
  }
}
