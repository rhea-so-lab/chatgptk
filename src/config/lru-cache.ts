import LRUCache from 'lru-cache';
import { ChatCompletionRequestMessage } from 'openai';

const cache = new LRUCache<string, ChatCompletionRequestMessage[]>({
  max: 1000, // 최대 1000개의 컨텍스트를 저장할 수 있음
  ttl: 1000 * 60 * 60 * 24 * 7, // 7 days (ms)
});

export { cache };
