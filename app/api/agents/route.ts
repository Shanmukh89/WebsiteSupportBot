import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agents = await prisma.agent.findMany({
      where: { userId: session.user.id },
      include: {
        knowledgeSources: {
          select: { id: true, title: true, url: true, status: true, pageCount: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(agents);
  } catch (error) {
    console.error("GET /api/agents error:", error);
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, url, messages } = await req.json();

    if (!name || !url) {
      return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        url,
        userId: session.user.id,
        status: "ready",
        messages: messages || [],
      }
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error("POST /api/agents error:", error);
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
  }
}
