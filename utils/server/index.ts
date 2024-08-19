import { Message } from '@/types/chat';
import { OpenAIModel } from '@/types/openai';

import { BACKEND_HOST } from '../app/const';

import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';

export class OpenAIError extends Error {
  type: string;
  param: string;
  code: string;

  constructor(message: string, type: string, param: string, code: string) {
    super(message);
    this.name = 'OpenAIError';
    this.type = type;
    this.param = param;
    this.code = code;
  }
}

export const OpenAIStream = async (
  model: OpenAIModel,
  systemPrompt: string,
  temperature : number,
  key: string,
  messages: Message[],
) => {
  let url = `${BACKEND_HOST}/chat`;
  const stream = await fetch(url, {
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key ? key : process.env.OPENAI_API_KEY}`,
    },
    method: 'POST',
    body: JSON.stringify({
      "id": "alkasdfasdf",
      "model": {
        "id": "llama-2-70b.Q5_K_M",
        "name": "llama-2-70b.Q5_K_M",
        "maxLength": 2048,
        "tokenLimit": 2048
      },
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
      "maxTokens": 2048,
      "temperature": 0,
      "prompt": "HUMAN: \n You are a helpful AI assistant.  Use the following context and chat history to answer the question at the end with a helpful answer.  Get straight to the point and always think things through step-by-step before answering.  If you don't know the answer, just say 'I don't know'; don't try to make up an answer. \n\n<context>{context}</context>\n<chat_history>{chat_history}</chat_history>\n<question>{question}</question>\n\nAI:  Here is the most relevant sentence in the context:  \n",
      "file": {
        "filename": "None",
        "title": "None",
        "username": "None",
        "state": "Unavailable"
      }
    }),
  });

  const decoder = new TextDecoder();

  if (stream.status !== 200) {
    const result = await stream.json();
    console.log(result);
  

    if (result.error) {
      throw new OpenAIError(
        result.error.message,
        result.error.type,
        result.error.param,
        result.error.code,
      );
    } else {
      throw new Error(
        `Backend returned an error: ${
          decoder.decode(result?.value) || result.statusText
        }`,
      );
    }
  }

  return stream.body;
};
