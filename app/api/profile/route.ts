import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, avatar } = await req.json();

    const updates: any = {};
    if (name) {
      updates.name = name;
      const parts = name.split(" ");
      updates.firstName = parts[0];
      updates.lastName = parts.slice(1).join(" ");
    }
    if (avatar) updates.image = avatar;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updates,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
