import { getServerSession } from "next-auth";
import "./globals.css";
import { Inter } from "next/font/google";
import authOptions from "@/lib/auth/options";
import NavBar from "@/components/NavBar";

const inter = Inter({ subsets: ["latin"] });

/**
 * @type {import("next").Metadata}
 */
export const metadata = {
  title: "IvySpence",
  description: "A beautiful expense management system",
  viewport: "width=device-width, initial-scale=1.0",
  charset: "UTF-8",
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body className={inter.className}>
        <NavBar session={session} />
        <div className="content">{children}</div>
      </body>
    </html>
  );
}
