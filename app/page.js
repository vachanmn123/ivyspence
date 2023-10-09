import NavBar from "@/components/NavBar";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/options";
import Link from "next/link";
import Image from "next/image";

export default async function Home() {
  const session = await getServerSession(authOptions);
  return (
    <>
      <div className="hero py-32 bg-base-100">
        <div className="hero-content max-w-7xl flex-col lg:flex-row-reverse">
          <Image
            src="/Screenshot.png"
            width={500}
            height={300}
            className="max-w-sm rounded-lg shadow-2xl lg:w-1/2"
            alt="IvySpence Screenshot"
          />
          <div className="lg:w-1/2">
            <h1 className="text-5xl font-bold">IvySpence</h1>
            <p className="py-6">
              IvySpence is a beautiful and easy-to-use expense manager designed
              to help you keep track of your finances. With its intuitive
              interface and powerful features, IvySpence makes it easy to manage
              your expenses, track your spending, and stay on top of your
              finances. Whether you&apos;re a busy professional, a student, or
              just someone who wants to stay on top of their finances, IvySpence
              is the perfect tool for you. So why wait? Get started today and
              take control of your finances with IvySpence!
            </p>
            <a href="/transactions">
              <button className="btn btn-primary">Get Started</button>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
