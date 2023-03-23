import { createParser, EventSourceParser } from 'eventsource-parser';
import { ChatCompletionRequestMessage } from 'openai';

// timeout is a helper function to set a timeout for a Promise
function timeout(ms: number, promise: Promise<any>) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('TIMEOUT'));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((reason) => {
        clearTimeout(timer);
        reject(reason);
      });
  });
}

// streamAsyncIterable is a helper function to convert a ReadableStream to an async iterable
async function* streamAsyncIterable(stream: any) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

// fetchSSE is a helper function to fetch a Server-Sent Event stream
async function fetchSSE(url: string, options: RequestInit, onMessage: (data: any) => void): Promise<void> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`fetchSSE error ${res.status || res.statusText}`);
  const parser: EventSourceParser = createParser((event) => {
    if (event.type === 'event') onMessage(event.data);
  });
  for await (const chunk of streamAsyncIterable(res.body)) {
    const str = new TextDecoder().decode(chunk);
    parser.feed(str);
  }
  parser.reset();
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

  async ask(question: string, onDelta?: (delta: string) => void): Promise<void> {
    // this.cache.push({ role: 'user', content: question });
    // const response: string = await this.fetch(this.cache, onDelta);
    await this.fetch([{ role: 'user', content: question }], onDelta);
    // this.cache.push({
    //   role: 'assistant',
    //   content: await this.fetch([
    //     { role: 'user', content: `Please summarize this in one sentence and korean and limiting the reply to 100 words. ###\n${response}\n###` },
    //   ]),
    // });
  }

  private async fetch(messages: ChatCompletionRequestMessage[], onDelta?: (delta: string) => void): Promise<string> {
    let response: string = '';
    await fetchSSE(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          stream: true,
          model: this.model,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          top_p: this.topP,
          frequency_penalty: this.frequencyPenalty,
          presence_penalty: this.presencePenalty,
          messages,
        }),
      },
      (data) => {
        if (data === '[DONE]') return;

        const chunk = JSON.parse(data);
        if (chunk === null) return;
        if (chunk.choices === null) return;
        if (chunk.choices.length === 0) return;

        const delta = chunk.choices[0].delta;
        if (delta === null) return;
        if (delta.content === undefined) return;

        response += delta.content;

        onDelta && onDelta(delta.content);
      },
    );
    return response;
  }
}
