import { createInterface } from 'readline';
import { Env } from '../config/env';
import { getAskChain } from '../chain/ask';

export class Terminal {
  public async listen() {
    if (!Env.OPENAI_API_KEY) {
      console.log('\x1b[90m%s\x1b[0m', 'Please enter your OpenAI API key:');
      Env.save({ OPENAI_API_KEY: await this.getOneLine() });
    }

    process.stdout.write('\x1b[2J\x1b[0f');

    this.cycle();
  }

  public async cycle() {
    const chain = await getAskChain();

    while (true) {
      console.log('\x1b[33m%s\x1b[0m', 'You:'); // Yellow
      const input = await this.getOneLine();
      if (input.length === 0) break;
      console.log();

      console.log('\x1b[36m%s\x1b[0m', 'ChatGPT:'); // Cyan
      await chain.call(input, (token) => process.stdout.write(token));
      console.log();
      console.log();
    }

    process.exit(0);
  }

  public async getOneLine() {
    const readline = createInterface({ input: process.stdin, output: process.stdout });
    readline.setPrompt('');
    return new Promise<string>((resolve) => {
      readline.on('line', (line) => {
        readline.close();
        resolve(line);
      });
    });
  }
}
