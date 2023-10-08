import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/options";
import { NextResponse } from "next/server";
/**
 *
 * @param {Request} req
 * @param {{ params: { id: string } }} params
 * @returns {import("next/server").NextResponse}
 */
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      transactions: true,
    },
  });
  const transaction = user?.transactions.find((t) => t.id === params.id);
  if (!transaction)
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  await prisma.transaction.delete({
    where: {
      id: params.id,
    },
  });
  return NextResponse.json({ success: true }, { status: 200 });
}
