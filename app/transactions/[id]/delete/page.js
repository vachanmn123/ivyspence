"use client";

/**
 *
 * @param {{ params: { id: string } }} param0
 */
export default function DeleteTransaction({ params }) {
  const handleDelete = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/deleteTransaction/${params.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      window.location.href = "/transactions";
    } else {
      alert("Something went wrong");
    }
  };
  return (
    <div className="flex h-full w-full justify-center align-middle">
      <div className="flex flex-col justify-center align-middle gap-5 m-auto">
        <h1 className="text-3xl font-bold text-center">Delete Transaction</h1>
        <p className="text-center">
          Are you sure you want to delete this transaction?
        </p>
        <div className="flex justify-center align-middle gap-5">
          <a
            href={`/transactions/${params.id}`}
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Delete
          </a>
          <a
            href={`/transactions/${params.id}`}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Cancel
          </a>
        </div>
      </div>
    </div>
  );
}
