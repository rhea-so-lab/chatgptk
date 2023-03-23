import { createParser, EventSourceParser } from 'eventsource-parser';
import { ChatCompletionRequestMessage } from 'openai';
import axios from 'axios';

function retry(url: string, ms: number, options: any): Promise<any> {
  return new Promise(async (resolve, reject) => {
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();

    const timer = setTimeout(() => {
      console.log('\x1b[90m%s\x1b[0m', 'retry...');
      source.cancel();
      retry(url, ms, options).then(resolve, reject);
    }, ms);

    try {
      const result = await axios.request({ ...options, url, method: 'POST', responseType: 'stream', cancelToken: source.token });
      clearTimeout(timer);
      resolve(result);
    } catch (err) {
      clearTimeout(timer);
    }
  });
}

// fetchSSE is a helper function to fetch a Server-Sent Event stream
async function fetchSSE(url: string, options: any): Promise<void> {
  let firstLetter: boolean = false;
  const parser: EventSourceParser = createParser((event) => {
    if (event.type === 'event') {
      const str = event.data;

      if (str.includes('[DONE]')) return;

      const chunk = JSON.parse(str);
      if (chunk === null) return;
      if (chunk.choices === null) return;
      if (chunk.choices.length === 0) return;

      const delta = chunk.choices[0].delta;
      if (delta === null) return;
      if (delta.content === undefined) return;

      if (!firstLetter && delta.content.replace(/\n/g, '').replace(/ /g, '').length === 0) return;
      firstLetter = true;

      process.stdout.write(delta.content);
    }
  });

  return new Promise(async (resolve, reject) => {
    const res = await retry(url, 1000, options);

    res.data.on('data', (data: Buffer) => {
      parser.feed(data.toString());
    });

    res.data.on('end', () => {
      parser.reset();
      resolve();
    });
  });
}

// ChatGPT is a class to interact with OpenAI's GPT-3 API
export class ChatGPT {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;
  private readonly topP: number;
  private readonly frequencyPenalty: number;
  private readonly presencePenalty: number;
  private readonly cache: ChatCompletionRequestMessage[] = [{ role: 'system', content: 'Answer to korean' }];

  constructor(
    apiKey: string,
    model?: string,
    maxTokens?: number,
    temperature?: number,
    topP?: number,
    frequencyPenalty?: number,
    presencePenalty?: number,
  ) {
    this.apiKey = apiKey;
    this.model = model ?? 'gpt-3.5-turbo';
    this.maxTokens = maxTokens ?? 2048;
    this.temperature = temperature ?? 0;
    this.topP = topP ?? 1;
    this.frequencyPenalty = frequencyPenalty ?? 0.2;
    this.presencePenalty = presencePenalty ?? 0.1;
  }

  async ask(question: string): Promise<void> {
    // this.cache.push({ role: 'user', content: question });
    // const response: string = await this.fetch(this.cache, onDelta);
    await this.fetch([{ role: 'user', content: question }]);
    // this.cache.push({
    //   role: 'assistant',
    //   content: await this.fetch([
    //     { role: 'user', content: `Please summarize this in one sentence and korean and limiting the reply to 100 words. ###\n${response}\n###` },
    //   ]),
    // });
  }

  private async fetch(messages: ChatCompletionRequestMessage[]): Promise<string> {
    let response: string = '';
    await fetchSSE('https://api.openai.com/v1/chat/completions', {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}`, Accept: 'text/event-stream' },
      data: JSON.stringify({
        stream: true,
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        top_p: this.topP,
        frequency_penalty: this.frequencyPenalty,
        presence_penalty: this.presencePenalty,
        messages,
      }),
    });
    return response;
  }
}
