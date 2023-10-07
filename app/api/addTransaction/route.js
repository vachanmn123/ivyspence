import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/options";

/**
 *
 * @param {Request} req
 * @returns {import("next/server").NextResponse}
 */
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
  });
  const data = await req.json();
  if (!data.name || !data.amount) {
    return NextResponse.json(
      { message: "Name and amount are required" },
      { status: 400 }
    );
  }
  if (data.amount == 0) {
    return NextResponse.json({ message: "Amount can't be 0" }, { status: 400 });
  }
  await prisma.transaction.create({
    data: {
      name: data.name,
      description: data.description,
      amount: data.amount,
      userId: user.id,
    },
  });
  return NextResponse.json({ message: "Transaction added" }, { status: 201 });
}
