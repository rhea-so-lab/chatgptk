import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({ apiKey: String('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') });

const openAIApi: OpenAIApi = new OpenAIApi(configuration);

export { openAIApi };
