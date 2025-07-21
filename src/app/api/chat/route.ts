import { streamText, tool } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Helper functions to generate different types of Mermaid diagrams
function generateFlowchartSyntax(description: string, title?: string): string {
  const titleLine = title ? `---\ntitle: ${title}\n---\n` : "";
  return `${titleLine}flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[End]
    D --> E

    %% ${description}`;
}

function generateSequenceSyntax(description: string, title?: string): string {
  const titleLine = title ? `---\ntitle: ${title}\n---\n` : "";
  return `${titleLine}sequenceDiagram
    participant A as User
    participant B as System
    participant C as Database

    A->>B: Request
    B->>C: Query
    C-->>B: Response
    B-->>A: Result

    Note over A,C: ${description}`;
}

function generateClassSyntax(description: string, title?: string): string {
  const titleLine = title ? `---\ntitle: ${title}\n---\n` : "";
  return `${titleLine}classDiagram
    class User {
        +String name
        +String email
        +login()
        +logout()
    }

    class System {
        +processRequest()
        +validateUser()
    }

    User --> System : uses

    note "${description}"`;
}

function generateStateSyntax(description: string, title?: string): string {
  const titleLine = title ? `---\ntitle: ${title}\n---\n` : "";
  return `${titleLine}stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : start
    Processing --> Success : complete
    Processing --> Error : fail
    Success --> [*]
    Error --> Idle : retry

    note "${description}"`;
}

function generateGanttSyntax(description: string, title?: string): string {
  const chartTitle = title || "Project Timeline";
  return `gantt
    title ${chartTitle}
    dateFormat  YYYY-MM-DD
    section Planning
    Task 1           :a1, 2024-01-01, 30d
    Task 2           :after a1, 20d
    section Development
    Task 3           :2024-02-01, 45d
    Task 4           :2024-02-15, 30d

    %% ${description}`;
}

function generatePieSyntax(description: string, title?: string): string {
  const chartTitle = title || "Data Distribution";
  return `pie title ${chartTitle}
    "Category A" : 42.96
    "Category B" : 50.05
    "Category C" : 10.01
    "Other" : 5

    %% ${description}`;
}

function generateJourneySyntax(description: string, title?: string): string {
  const chartTitle = title || "User Journey";
  return `journey
    title ${chartTitle}
    section Discovery
      Find website: 5: User
      Browse products: 3: User
    section Purchase
      Add to cart: 5: User
      Checkout: 2: User
      Payment: 1: User
    section Post-purchase
      Receive product: 5: User
      Leave review: 3: User

    %% ${description}`;
}

function generateGitgraphSyntax(description: string, title?: string): string {
  const titleLine = title ? `---\ntitle: ${title}\n---\n` : "";
  return `${titleLine}gitgraph
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit

    %% ${description}`;
}

function generateMindmapSyntax(description: string, title?: string): string {
  const rootTitle = title || "Central Topic";
  return `mindmap
  root((${rootTitle}))
    Topic A
      Subtopic 1
      Subtopic 2
    Topic B
      Subtopic 3
      Subtopic 4
    Topic C
      Subtopic 5

  %% ${description}`;
}

function generateTimelineSyntax(description: string, title?: string): string {
  const chartTitle = title || "Timeline";
  return `timeline
    title ${chartTitle}

    2021 : Event A
         : Event B
    2022 : Event C
         : Event D
    2023 : Event E
         : Event F

    %% ${description}`;
}

// Mermaid diagram generation tool
const generateMermaidDiagram = tool({
  description: "Generate Mermaid diagram syntax based on user requirements. Use this when users ask for diagrams, flowcharts, or visual representations.",
  parameters: z.object({
    diagramType: z.enum([
      "flowchart",
      "sequence",
      "class",
      "state",
      "gantt",
      "pie",
      "journey",
      "gitgraph",
      "mindmap",
      "timeline"
    ]).describe("The type of Mermaid diagram to generate"),
    description: z.string().describe("Description of what the diagram should show"),
    title: z.string().optional().describe("Optional title for the diagram")
  }),
  execute: async ({ diagramType, description, title }) => {
    // Generate Mermaid syntax based on the diagram type and description
    let mermaidSyntax = "";

    switch (diagramType) {
      case "flowchart":
        mermaidSyntax = generateFlowchartSyntax(description, title);
        break;
      case "sequence":
        mermaidSyntax = generateSequenceSyntax(description, title);
        break;
      case "class":
        mermaidSyntax = generateClassSyntax(description, title);
        break;
      case "state":
        mermaidSyntax = generateStateSyntax(description, title);
        break;
      case "gantt":
        mermaidSyntax = generateGanttSyntax(description, title);
        break;
      case "pie":
        mermaidSyntax = generatePieSyntax(description, title);
        break;
      case "journey":
        mermaidSyntax = generateJourneySyntax(description, title);
        break;
      case "gitgraph":
        mermaidSyntax = generateGitgraphSyntax(description, title);
        break;
      case "mindmap":
        mermaidSyntax = generateMindmapSyntax(description, title);
        break;
      case "timeline":
        mermaidSyntax = generateTimelineSyntax(description, title);
        break;
      default:
        mermaidSyntax = generateFlowchartSyntax(description, title);
    }

    return `Here's your ${diagramType} diagram:

\`\`\`mermaid
${mermaidSyntax}
\`\`\`

This diagram shows ${description}. The Mermaid syntax above will be automatically rendered as an interactive diagram in the chat interface.`;
  }
});

export async function POST(request: Request): Promise<Response> {
  try {
    const { messages } = await request.json();

    // Check for required environment variables
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY environment variable is required");
    }

    // Define available tools
    const tools = {
      generateMermaidDiagram
    };

    // System message for Mermaid-focused chatbot
    const systemMessage = `You are a helpful AI assistant specialized in creating and explaining Mermaid diagrams. I can help you:

1. Generate various types of Mermaid diagrams (flowcharts, sequence diagrams, class diagrams, state diagrams, Gantt charts, pie charts, user journey maps, git graphs, mindmaps, and timelines)
2. Explain how different diagram types work
3. Provide guidance on Mermaid syntax
4. Help you visualize processes, systems, and data

When users ask for diagrams or visual representations, I'll use the generateMermaidDiagram tool to create appropriate Mermaid syntax that will be rendered inline in the chat interface.

Feel free to ask me to create diagrams for processes, workflows, system architectures, project timelines, or any other visual representation you need!`;

    console.log("Mermaid AI Chatbot - Processing request with tools:", Object.keys(tools));

    // Stream the response using Groq with Mermaid tools
    const result = streamText({
      model: groq("qwen/qwen3-32b"),
      system: systemMessage,
      messages,
      tools,
    });

    // Return the streaming response
    const response = result.toDataStreamResponse();

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


