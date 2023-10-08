import TransactionEdit from "@/components/TransactionEdit";
import authOptions from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

export default async function Page({ params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return <div>Access Denied</div>;
  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      transactions: true,
    },
  });
  if (user?.transactions.filter((t) => t.id === params.id).length === 0) {
    return <div>Access Denied</div>;
  }
  const transaction = await prisma.transaction.findUnique({
    where: {
      id: params.id,
    },
  });
  return (
    <div className="w-full">
      <TransactionEdit transaction={transaction} user={user} />
    </div>
  );
}
