import { createParser } from 'eventsource-parser';

async function* streamAsyncIterable(stream: any) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

export async function fetchSSE(url: string, options: { onMessage: (data: string) => void } & RequestInit) {
  const { onMessage, ...fetchOptions } = options;
  const res = await fetch(url, fetchOptions);

  if (!res.ok) {
    const reason = await res.text();
    const msg = `ChatGPT error ${res.status || res.statusText}: ${reason}`;
    console.log(msg);
    throw { msg, statusCode: res.status, statusText: res.statusText, cause: reason };
  }

  const parser = createParser((event) => {
    if (event.type === 'event') {
      onMessage(event.data);
    }
  });

  if (!res.body?.getReader) {
    const body: any = res.body;
    if (!body.on || !body.read) {
      throw new Error('unsupported "fetch" implementation');
    }
    body.on('readable', () => {
      let chunk;
      while (null !== (chunk = body.read())) {
        parser.feed(chunk.toString());
      }
    });
  } else {
    for await (const chunk of streamAsyncIterable(res.body)) {
      const str = new TextDecoder().decode(chunk);
      parser.feed(str);
    }
  }
}
