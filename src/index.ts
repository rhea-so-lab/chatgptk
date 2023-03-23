import { createInterface } from 'readline';
import { ChatGPT } from './chat-gpt';

const chatGPT = new ChatGPT('');

function cycle() {
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  readline.setPrompt('');
  let input: string = '';
  console.log('\x1b[33m%s\x1b[0m', 'You:'); // Yellow
  readline.on('line', (line) => {
    input += line;
    readline.close();
  });
  readline.on('close', async () => {
    if (input.length === 0) process.exit(0);
    console.log();
    console.log('\x1b[36m%s\x1b[0m', 'ChatGPT:'); // Cyan
    await chatGPT.ask(input, (delta) => process.stdout.write(delta));
    console.log('\n');
    cycle();
  });
}

cycle();
