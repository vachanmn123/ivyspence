import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/options";
import { redirect } from "next/navigation";

/**
 *
 * @param {Request} req
 * @param {{ params: { id: string } }} params
 * @returns {import("next/server").NextResponse}
 */
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      transactions: true,
    },
  });
  const transaction = await prisma.transaction.findUnique({
    where: {
      id: params.id,
    },
  });
  if (!transaction) {
    return NextResponse.json(
      { message: "Transaction not found" },
      { status: 404 }
    );
  }
  if (user.transactions.findIndex((t) => t.id === transaction.id) === -1) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const info = await req.json();
  await prisma.transaction.update({
    where: {
      id: transaction.id,
    },
    data: {
      description: info.description,
      amount: parseFloat(info.amount) * (info.type === "income" ? 1 : -1),
      createdAt: new Date(info.date),
    },
  });
  return NextResponse.json({ message: "Transaction updated" }, { status: 200 });
}
