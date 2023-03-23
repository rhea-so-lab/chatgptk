import { ChatCompletionRequestMessage } from 'openai';
import { cache } from '../config/lru-cache';
import { ask } from './open-ai';

class ChatBot {
  async listen(): Promise<void> {
    const history: ChatCompletionRequestMessage[] = cache.get('any-key') ?? [];
    cache.set('any-key', [...history, { role: 'user', content: 'lodash가 무엇인지와 간단한 사용 방법을 설명해줘' }]);
    console.log(`YOU: lodash가 무엇인지와 간단한 사용 방법을 설명해줘`);

    await ask({ messages: cache.get('any-key')! });
  }
}

export { ChatBot };
