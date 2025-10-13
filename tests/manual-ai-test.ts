/**
 * Manual test script for the AI chat endpoint
 * Run with: bun run tests/manual-ai-test.ts
 *
 * This script sends a question to the AI and prints the streaming response.
 * Useful for testing the AI behavior manually.
 */

const BASE_URL = "http://localhost:4330";
const EXAM_ID = "15384"; // TATA24 exam with solution

async function testAIChat() {
  console.log("Testing AI Chat Endpoint\n");
  console.log(`Exam ID: ${EXAM_ID}`);
  console.log(`Question: "Förklara uppgift 1 från tentan"\n`);
  console.log("Response:\n");

  const response = await fetch(`${BASE_URL}/exams/exam/${EXAM_ID}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content:
            "Förklara uppgift 1 från tentan och hur man löser den enligt lösningen",
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error(`Error: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.error(text);
    return;
  }

  if (!response.body) {
    console.error("No response body");
    return;
  }

  // Stream the response
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const text = decoder.decode(value, { stream: true });
      process.stdout.write(text);
    }
  } finally {
    reader.releaseLock();
  }

  console.log("\n\n Test completed!");
}

// Test with follow-up question
async function testFollowUpQuestion() {
  console.log("\n\n🧪 Testing Follow-up Question (without PDF resend)\n");
  console.log(`Question: "Kan du förklara det här mer i detalj?"\n`);
  console.log("Response:\n");

  const response = await fetch(`${BASE_URL}/exams/exam/${EXAM_ID}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: "Förklara uppgift 1 från tentan",
        },
        {
          role: "assistant",
          content: "Här är en förklaring av uppgift 1...",
        },
        {
          role: "user",
          content:
            "Kan du förklara steget med matrismultiplikation mer i detalj?",
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error(`Error: ${response.status} ${response.statusText}`);
    return;
  }

  if (!response.body) {
    console.error("No response body");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const text = decoder.decode(value, { stream: true });
      process.stdout.write(text);
    }
  } finally {
    reader.releaseLock();
  }

  console.log("\n\n Follow-up test completed!");
}

// Run tests
console.log("Make sure the server is running on http://localhost:4330\n");
testAIChat()
  .then(() => testFollowUpQuestion())
  .catch(console.error);
