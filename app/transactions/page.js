import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/options";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TransactionForm from "@/components/TransactionForm";
import Image from "next/image";

export default async function transactions() {
  /**
   * @type {import("next-auth").Session}
   */
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/api/auth/signin?next=/transactions");
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
    <div className="md:flex md:flex-row gap-12 max-w-full">
      <div className="md:flex md:flex-col md:w-2/3">
        <h2 className="dark:dark:text-white text-black text-5xl font-bold py-5">
          Transactions
        </h2>
        {/* Table is shown only on larger devices */}
        <table className="table table-zebra table-pin-rows hidden md:table">
          <thead className="dark:text-white text-black">
            <tr>
              <th></th>
              <th>Transaction Name</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Transaction Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {user?.transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>
                  {transaction.amount < 0 ? (
                    <Image
                      src="/expenseIcon.svg"
                      width={55}
                      height={55}
                      className="object-contain self-center h-[3rem]"
                      alt="Outwards icon"
                    />
                  ) : (
                    <Image
                      src="/incomeIcon.svg"
                      width={55}
                      height={55}
                      className="object-contain self-center h-[3rem]"
                      alt="Inwards icon"
                    />
                  )}
                </td>
                <td>
                  <b>{transaction.name}</b>
                </td>
                <td>{transaction.description}</td>
                <td>
                  {Math.abs(transaction.amount)} {user.defaultCurrencyCode}
                </td>
                <td>{transaction.createdAt.toDateString()}</td>
                <td className="flex gap-2">
                  <a href={`/transactions/${transaction.id}`}>
                    <button className="btn btn-primary">Edit</button>
                  </a>
                  <a href={`/transactions/${transaction.id}/delete`}>
                    <button className="btn btn-error text-white">Delete</button>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Cards are shown on mobile */}
        {user?.transactions.map((transaction) => (
          <div className="md:hidden w-full" key={transaction.id}>
            <div className="flex flex-row py-5 px-5 align-middle justify-between w-full gap-5">
              <div className="flex flex-col text-5xl justify-self-start">
                <Image
                  height={55}
                  width={55}
                  src={
                    transaction.amount < 0
                      ? "/expenseIcon.svg"
                      : "/incomeIcon.svg"
                  }
                  alt="Inwards icon"
                  className="self-center object-contain h-[3rem]"
                />
              </div>
              <div className="flex flex-col justify-self-center">
                <span className="text-xl">{transaction.name}</span>
                <span className="text-sm">{transaction.description}</span>
              </div>
              <div className="flex flex-col justify-self-end">
                <span className="text-xl">
                  {Math.abs(transaction.amount)} {user.defaultCurrencyCode}
                </span>
                <span className="text-sm">
                  {transaction.createdAt.toDateString()}
                </span>
              </div>
              <div className="flex gap-2">
                <a href={`/transactions/${transaction.id}`}>
                  <button className="btn btn-primary">Edit</button>
                </a>
                <a href={`/transactions/${transaction.id}/delete`}>
                  <button className="btn btn-error text-white">Delete</button>
                </a>
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <p className="text-xl font-bold">
            Balance:{" "}
            <span style={{ color: total >= 0 ? "green" : "red" }}>
              {total} {user.defaultCurrencyCode}
            </span>
          </p>
        </div>
      </div>
      <div className="md:flex md:flex-col md:w-1/3 gap-6">
        <TransactionForm />
      </div>
    </div>
  );
}
