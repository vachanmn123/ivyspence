import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/options";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function transactions() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/api/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      transactions: true,
    },
  });
  let total = 0;
  user?.transactions.map((transaction) => {
    total += transaction.amount;
  });
  return (
    <div>
      <h2 className="dark:dark:text-white text-black text-5xl font-bold">
        Transactions
      </h2>
      <table className="table table-zebra table-pin-rows">
        <thead className="dark:text-white text-black">
          <tr>
            <td colSpan={4}>
              <div className="flex justify-end">
                <a href="/transactions/add">
                  <button className="btn btn-primary">Add Transaction</button>
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <th>Transaction ID</th>
            <th>Amount</th>
            <th>Transaction Date</th>
            <th>Transaction Type</th>
          </tr>
        </thead>
        <tbody>
          {user?.transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{transaction.id}</td>
              <td>{transaction.amount}</td>
              <td>
                {transaction.createdAt.getDate()}-
                {transaction.createdAt.getMonth()}-
                {transaction.createdAt.getFullYear()}
              </td>
              <td>
                {transaction.amount < 0 ? (
                  <p style={{ color: "red" }}>DEBIT</p>
                ) : (
                  <p style={{ color: "green" }}>CREDIT</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="dark:text-white text-black">
          <tr>
            <td colSpan={4}>
              <div className="flex justify-end">
                <p className="text-xl">
                  Total:{" "}
                  <span style={{ color: total > 0 ? "green" : "red" }}>
                    {total}
                  </span>
                </p>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
