#!/usr/bin/env node
import { createInterface } from 'readline';
import { ChatGPT } from './chat-gpt';
import fs from 'fs';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '..', '.env') });
let chatGPT: ChatGPT;

if (!process.env.API_KEY) {
  console.log('\x1b[90m%s\x1b[0m', 'Please enter your OpenAI API key:');
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  readline.setPrompt('');
  readline.on('line', (line) => {
    process.env.API_KEY = line.replace(/\n/g, '').replace(/ /g, '');
    readline.close();
  });
  readline.on('close', async () => {
    console.log('\x1b[90m%s\x1b[0m', 'API key set.\n');
    fs.writeFileSync(join(__dirname, '..', '.env'), `API_KEY=${process.env.API_KEY}`);
    chatGPT = new ChatGPT(process.env.API_KEY!);
    cycle();
  });
} else {
  chatGPT = new ChatGPT(process.env.API_KEY);
  cycle();
}

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
