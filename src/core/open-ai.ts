import { ChatCompletionRequestMessage } from 'openai';
import { openAIApi } from '../config/open-ai';
import { fetchSSE } from './fetch-sse';

type ChatGPTInput = {
  messages: ChatCompletionRequestMessage[];
};

type Response = {
  role: 'assistant';
  content: string;
};

async function ask({ messages }: ChatGPTInput) {
  process.stdout.write(`\nCHATGPT: `);
  const result = {
    role: 'assistant',
    text: '',
    delta: null,
    detail: null,
  };
  await fetchSSE('https://api.openai.com/v1/chat/completions', {
    onMessage: (data) => {
      var _a2;
      if (data === '[DONE]') {
        result.text = result.text.trim();
        return result;
      }
      try {
        const response = JSON.parse(data);
        if (response.id) {
          // console.log('OpenAI stream SEE event id', response.id);
        }
        if ((_a2 = response == null ? void 0 : response.choices) == null ? void 0 : _a2.length) {
          const delta = response.choices[0].delta;
          result.delta = delta.content;
          if (delta == null ? void 0 : delta.content) result.text += delta.content;
          result.detail = response;
          if (delta.role) {
            result.role = delta.role;
          }
          if (result.delta) {
            process.stdout.write(`${result.delta}`);
          }
        }
      } catch (err) {
        console.warn('OpenAI stream SEE event unexpected error', err);
      }
    },
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer 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`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'system', content: 'You are ChatGPT. Answer as concisely as possible.' }, ...messages],
      max_tokens: 2048,
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0.2,
      presence_penalty: 0.1,
      stream: true,
    }),
  });
  process.stdout.write(`\n`);

  // const completion = await openAIApi.createChatCompletion({
  //   model: 'gpt-3.5-turbo',
  //   max_tokens: 2048, // max 4000
  //   messages: [{ role: 'system', content: 'You are ChatGPT. Answer as concisely as possible.' }, ...messages],
  //   temperature: 0.7, // 의외성 (0~1)
  //   top_p: 1, // 단어 풀의 범위(0~1)
  //   frequency_penalty: 0.2, // 자주 사용하는 단어 억제
  //   presence_penalty: 0.1, // 이미 사용된 단어 억제
  // });

  // const response: string | undefined = completion.data.choices.at(0)?.message?.content;

  // if (!response) throw Error('알 수 없는 에러 : 응답을 찾을 수 없습니다.');

  // return { role: 'assistant', content: response };
}

export { ask };
