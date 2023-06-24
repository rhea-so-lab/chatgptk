import { Env } from '../config/env';

export async function getAskChain() {
  const { OpenAI } = await import('langchain/llms/openai');
  const { CallbackManager } = await import('langchain/callbacks');
  const { ConversationChain } = await import('langchain/chains');

  let deltaListener: (token: string) => void;

  const model = new OpenAI({
    openAIApiKey: Env.OPENAI_API_KEY,
    modelName: 'gpt-3.5-turbo',
    streaming: true,
    temperature: 0,
    topP: 1,
    frequencyPenalty: 0.2,
    presencePenalty: 0.1,
    callbackManager: CallbackManager.fromHandlers({
      handleLLMNewToken: async (token: string) => {
        deltaListener(token);
      },
    }),
  });

  const chain = new ConversationChain({ llm: model });

  return {
    call: async (input: string, onDelta?: (token: string) => void) => {
      deltaListener = onDelta || (() => {});
      await chain.call({ input });
    },
  };
}
