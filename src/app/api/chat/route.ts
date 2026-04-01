import { streamObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { createMoonshotAI } from '@ai-sdk/moonshotai';
import { z } from "zod";

const moonshotai = createMoonshotAI({
  apiKey: "sk-99LcwQMmtkMui0K5kzzZ932gh7eqNVCVib7u6Jd1dC431stm",
  baseURL: "https://api.moonshot.cn/v1",

});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Zod schema for structured Mermaid diagram output
const mermaidDiagramSchema = z.object({
  title: z.string().describe("A descriptive title for the diagram"),
  thinking: z.string().describe("The AI agent's reasoning process and explanation of the diagram"),
  mermaidCode: z.string().describe("The complete Mermaid diagram syntax. Do not put extraneous content.")
});


export async function POST(request: Request): Promise<Response> {
  try {
    const { messages } = await request.json();

    // Check for required environment variables
    // if (!process.env.GROQ_API_KEY) {
    //   throw new Error("GROQ_API_KEY environment variable is required");
    // }

    // System message for Mermaid-focused chatbot
    const systemMessage = `You are a helpful AI assistant specialized in creating Mermaid diagrams.

You MUST respond with a valid JSON object containing exactly these three fields:
{
  "mermaidCode": "The complete, valid Mermaid diagram syntax",
  "thinking": "Your reasoning process and explanation of the diagram design choices",
  "title": "A descriptive title for the diagram"
}

IMPORTANT:
- Respond ONLY with the JSON object, no additional text or tags
- Do not include <think> tags or any other wrapper elements
- The mermaidCode must be valid Mermaid syntax
- Include proper escaping for newlines in the mermaidCode field

You can create various types of Mermaid diagrams including:
- Flowcharts (flowchart TD/LR)
- Sequence diagrams (sequenceDiagram)
- Class diagrams (classDiagram)
- State diagrams (stateDiagram-v2)
- Gantt charts (gantt)
- Pie charts (pie)
- User journey maps (journey)
- Git graphs (gitgraph)
- Mindmaps (mindmap)
- Timelines (timeline)

Always ensure the Mermaid syntax is valid and follows proper formatting.`;

    // Stream the structured object response using Groq



    const result = streamObject({
      model: moonshotai("kimi-k2.5"),
      system: systemMessage,
      messages,
      schema: mermaidDiagramSchema,
    });

    // Return the streaming response
    const response = result.toTextStreamResponse();

    // Add headers to ensure proper streaming
    response.headers.set('Cache-Control', 'no-cache');
    response.headers.set('Connection', 'keep-alive');
    response.headers.set('X-Content-Type-Options', 'nosniff');

    return response;
  } catch (error) {
    console.error("Error in chat API:", error);

    // Return a streaming-compatible error response
    const errorStream = new ReadableStream({
      start(controller) {
        // Send error in the expected data stream format
        const errorData = `0:"Error: Failed to process chat request. Please try again."\n`;
        controller.enqueue(new TextEncoder().encode(errorData));
        controller.close();
      }
    });

    return new Response(errorStream, {
      status: 200, // Use 200 to ensure the stream is processed
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
      },
    });
  }
}

