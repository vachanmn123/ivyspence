"use client";

export default function () {
  return (
    <div>
      <h1>Add Transaction</h1>
      <form>
        <input type="text" name="name" placeholder="Name" />
        <input type="text" name="amount" placeholder="Amount" />
        <input type="submit" value="Add" />
      </form>
    </div>
  );
}
