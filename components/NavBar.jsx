"use client";

export default function NavBar({ session }) {
  return (
    <nav className="navbar bg-base-100">
      <div className="flex-1">
        <a className="btn btn-ghost normal-case text-xl" href="/">
          IvySpence
        </a>
        <a href="/transactions" className=" normal-case mx-3">
          Transactions
        </a>
      </div>
      <div className="flex-none">
        {session ? (
          <div className="dropdown dropdown-end z-50">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <img src={session.user.image} />
              </div>
            </label>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li>
                <a href="/settings">Settings</a>
              </li>
              <li>
                <a href="/api/auth/signout">Logout</a>
              </li>
            </ul>
          </div>
        ) : (
          <a className="btn btn-ghost" href="/api/auth/signin">
            Login
          </a>
        )}
      </div>
    </nav>
  );
}
