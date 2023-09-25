import NavBar from "@/components/NavBar";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/options";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);
  return (
    <div>
      LETS JUST NOT TALK ABOUT THIS FOR SOME TIME.
      <br />
      LOL JUST DONT
      <Link href="/transactions">transactions</Link>
    </div>
  );
}
