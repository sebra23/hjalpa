import { TRPCError } from "@trpc/server";
import { chatRequestSchema } from "@contracts/chat";
import { getMillisMetadata, MILLIS_AGENT_ID } from "@contracts/millis";
import { env } from "./lib/env";
import { createRouter, publicQuery } from "./middleware";

const MILLIS_CHAT_URL = "https://api-west.millis.ai/chat/completions";

type StreamResult = { content: string; done: boolean };

function consumeEvent(event: string): StreamResult {
  let content = "";
  let done = false;

  for (const line of event.split("\n")) {
    if (!line.startsWith("data:")) continue;
    const data = line.slice(5).trim();
    if (!data) continue;
    if (data === "[DONE]") {
      done = true;
      continue;
    }

    const parsed = JSON.parse(data) as {
      choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
      error?: unknown;
    };
    if (parsed.error) throw new Error("Millis returned a streaming error");
    content += parsed.choices?.[0]?.delta?.content ?? parsed.choices?.[0]?.message?.content ?? "";
  }

  return { content, done };
}

async function readChatStream(response: Response) {
  if (!response.body) throw new Error("Millis returned no stream");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let done = false;

  while (!done) {
    const { value, done: streamEnded } = await reader.read();
    buffer += decoder.decode(value, { stream: !streamEnded }).replace(/\r\n/g, "\n");
    let boundary = buffer.indexOf("\n\n");

    while (boundary >= 0) {
      const result = consumeEvent(buffer.slice(0, boundary));
      content += result.content;
      done ||= result.done;
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");
    }

    if (streamEnded) break;
  }

  if (buffer.trim()) {
    const result = consumeEvent(buffer);
    content += result.content;
    done ||= result.done;
  }

  if (!done) throw new Error("Millis chat stream ended before completion");
  const message = content.trim();
  if (!message) throw new Error("Millis returned an empty chat response");
  return message;
}

export const chatRouter = createRouter({
  message: publicQuery.input(chatRequestSchema).mutation(async ({ input }) => {
    if (!env.millisApiKey) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Textchatten är inte aktiverad ännu" });
    }

    let response: Response;
    try {
      response = await fetch(MILLIS_CHAT_URL, {
        method: "POST",
        headers: {
          authorization: env.millisApiKey,
          "content-type": "application/json",
          accept: "text/event-stream",
        },
        body: JSON.stringify({
          agent: {
            agent_id: MILLIS_AGENT_ID,
            metadata: getMillisMetadata(input.profile, input.publicId),
            include_metadata_in_prompt: true,
          },
          messages: input.messages,
          end_of_session: false,
        }),
        signal: AbortSignal.timeout(45_000),
      });
    } catch {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Chatten kunde inte nå Millis" });
    }

    if (!response.ok) {
      if (response.status === 429) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Chatten är upptagen. Försök igen om en liten stund" });
      }
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Millis kunde inte besvara chatten" });
    }

    try {
      return { message: await readChatStream(response) };
    } catch {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Chattens svar kunde inte läsas" });
    }
  }),
});
