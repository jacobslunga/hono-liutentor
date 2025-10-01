import "dotenv/config";

import * as readline from "node:readline/promises";

import { type ModelMessage, streamText } from "ai";

import { openai } from "@ai-sdk/openai";

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: ModelMessage[] = [];

async function main() {
  while (true) {
    const userInput = await terminal.question("You: ");

    messages.push({ role: "user", content: userInput });

    const result = streamText({
      model: openai("gpt-4o"),
      messages: [
        ...messages,
        {
          role: "user",
          content: [
            {
              type: "file",
              data: new URL(
                "https://mkunnogkkppsclxprvvb.supabase.co/storage/v1/object/public/exam-pdfs/TATA24_2025-08-22_EXAM.pdf"
              ),
              mediaType: "application/pdf",
            },
          ],
        },
      ],
    });

    let fullResponse = "";
    process.stdout.write("\nAssistant: ");
    for await (const delta of result.textStream) {
      fullResponse += delta;
      process.stdout.write(delta);
    }
    process.stdout.write("\n\n");

    messages.push({ role: "assistant", content: fullResponse });
  }
}

main().catch(console.error);
