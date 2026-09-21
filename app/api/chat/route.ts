import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { agentId, message, history = [] } = await req.json();

    if (!agentId || !message) {
      return NextResponse.json({ error: "Agent ID and Message are required" }, { status: 400 });
    }

    // 1. Generate embedding for the user's message
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const embeddingResponse = await embeddingModel.embedContent(message);
    const embedding = embeddingResponse.embedding.values;

    // 2. Query Postgres pgvector using Prisma raw query
    // We format the array to a pgvector string format: '[0.1, 0.2, ...]'
    const embeddingString = `[${embedding.join(',')}]`;
    
    const chunks = await prisma.$queryRaw<Array<{ content: string }>>`
      SELECT content 
      FROM "KnowledgeChunk" 
      WHERE "agentId" = ${agentId}
      ORDER BY embedding <-> ${embeddingString}::vector 
      LIMIT 5
    `;

    const contextText = chunks.map(c => c.content).join("\n\n---\n\n");

    // 3. Prepare Gemini conversation
    const systemInstruction = `You are a helpful customer support AI agent for a specific website. 
Use the following context snippets from the website's knowledge base to answer the user's question accurately.
If the answer is not in the context, politely let them know that you cannot find the specific information.
Do NOT mention "context snippets" or "the knowledge base" in your reply, just answer naturally as the agent.

Context from website:
${contextText}`;

    const formattedHistory = history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
    
    const chatModel = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction 
    });

    const chat = chatModel.startChat({
      history: formattedHistory,
    });

    // 4. Stream response
    const streamResult = await chat.sendMessageStream(message);

    const encoder = new TextEncoder();

    const customStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of streamResult.stream) {
          const text = chunk.text();
          if (text) {
            // Send in SSE format compatible with existing frontend parser
            const payload = `data: ${JSON.stringify({ text })}\n\n`;
            controller.enqueue(encoder.encode(payload));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(customStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json({ error: "Failed to generate chat response" }, { status: 500 });
  }
}
