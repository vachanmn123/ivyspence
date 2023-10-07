"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

function TransactionForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [credit, setCredit] = useState(false);
  const handleSubmit = (e) => {
    setSubmitting(true);
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    if (Number.isNaN(Number(data.amount))) {
      setError("Amount must be a number");
      setSubmitting(false);
      setCredit(false);
      return;
    }
    if (Number(data.amount) == 0) {
      setError("Amount must not be 0");
      setSubmitting(false);
      setCredit(false);
      return;
    }
    const formattedData = {
      name: data.name,
      amount: credit ? parseFloat(data.amount) : 0 - parseFloat(data.amount),
      date: new Date(data.date).toISOString(),
      description: data.description,
    };
    fetch("/api/addTransaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formattedData),
    }).then((res) => {
      if (res.ok) {
        setSubmitting(false);
        setError(null);
        router.refresh();
        setCredit(false);
        return;
      } else {
        setError("Something went wrong");
        setSubmitting(false);
        setCredit(false);
        return;
      }
    });
  };
  return (
    <>
      <h3 className="dark:dark:text-white text-black text-3xl font-bold py-5">
        Add New Transaction
      </h3>
      {submitting ? (
        <div className="flex flex-col justify-center items-center h-full">
          Adding...
        </div>
      ) : (
        <>
          {error != null ? (
            <div className="alert alert-error">{error}</div>
          ) : null}
          <form
            action=""
            onSubmit={handleSubmit}
            className="flex flex-col gap-6"
          >
            <div className="form-control w-full">
              <input
                type="text"
                name="name"
                id="name"
                placeholder="Name"
                className="input input-bordered w-full"
                required
                maxLength={20}
              />
            </div>
            <div className="form-control w-full">
              <input
                type="text"
                name="description"
                id="description"
                placeholder="Description"
                className="input input-bordered w-full"
                maxLength={50}
              />
            </div>
            <div className="form-control w-full">
              <input
                type="decimal"
                name="amount"
                id="amount"
                placeholder="Amount"
                required
                className="input input-bordered w-full"
              />
            </div>
            <div className="form-control w-full">
              <input
                type="date"
                name="date"
                id="date"
                placeholder="Date"
                className="input input-bordered w-full"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div className="form-control w-full justify-center ">
              <label className="cursor-pointer label">
                <span className="label-text">Debit</span>
                <input
                  type="checkbox"
                  className="toggle toggle-accent select-secondary"
                  name="credit"
                  id="credit"
                  onChange={(e) => setCredit(e.target.checked)}
                />
                <span className="label-text">Credit</span>
              </label>
            </div>
            <div className="form-control w-full">
              <button className="btn btn-primary" type="submit">
                Add Transaction
              </button>
            </div>
          </form>
        </>
      )}
    </>
  );
}

export default TransactionForm;
