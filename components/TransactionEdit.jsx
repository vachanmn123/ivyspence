"use client";

export default function TransactionEdit({ transaction, user }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/editTransaction/${transaction.id}`, {
      method: "POST",
      body: JSON.stringify({
        description: e.target.description.value,
        amount: e.target.amount.value,
        type: e.target.type.value,
        date: e.target.date.value,
      }),
    });
    if (res.ok) {
      window.location.href = "/transactions";
    } else {
      alert("Error: " + res.statusText);
    }
  };
  return (
    <form onSubmit={handleSubmit} method="post">
      <h2 className="dark:dark:text-white text-black text-5xl font-bold py-5">
        {transaction.name}
      </h2>
      <p>Transaction Information</p>
      <div className="grid grid-cols-2 w-full gap-12 py-5">
        <div>
          <h3 className="text-3xl font-bold">Description</h3>
          <input
            className=" text-xl py-1 input mr-3"
            type="text"
            defaultValue={transaction.description}
            name="description"
            id="description"
          />
        </div>
        <div>
          <h3 className="text-3xl font-bold">Amount</h3>
          <input
            className=" text-xl py-1 input mr-3"
            type="text"
            defaultValue={`${Math.abs(transaction.amount)}`}
            name="amount"
            id="amount"
          />
          {user?.defaultCurrencyCode}
        </div>
        <div>
          <h3 className="text-3xl font-bold">Transaction Type</h3>
          <select
            name="type"
            id="type"
            defaultValue={transaction.amount > 0 ? "income" : "expense"}
            className="select text-xl"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div>
          <h3 className="text-3xl font-bold">Date</h3>
          <input
            className=" text-xl py-1 input mr-3"
            type="date"
            defaultValue={transaction.createdAt.toISOString().split("T")[0]}
            name="date"
            id="date"
          />
        </div>
      </div>
      <button className="btn btn-primary w-full" type="submit">
        Save
      </button>
    </form>
  );
}
