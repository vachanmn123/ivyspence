import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GithubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";
import prisma from "../prisma";
import { hash } from "bcrypt";

/**
 * @type {import("next-auth").AuthOptions}
 */
const authOptions = {
  // Secret for Next-auth, without this JWT encryption/decryption won't work
  secret: process.env.NEXTAUTH_SECRET,

  // Configure one or more authentication providers
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      
    }),
    // CredentialsProvider({
    //   name: "Credentials",
    //   credentials: {
    //     username: {
    //       label: "Username",
    //       type: "text",
    //       placeholder: "Username",
    //     },
    //     password: {
    //       label: "Password",
    //       type: "password",
    //       placeholder: "Password",
    //     },
    //   },
    //   async authorize(credentials) {
    //     const user = await prisma.account.findUnique({
    //       where: {
    //         provider_providerAccountId: {
    //           provider: "credentials",
    //           providerAccountId: credentials.username,
    //         },
    //         passwordHash: await hash(credentials.password, 10),
    //       },
    //     });
    //     if (user) {
    //       return user;
    //     } else {
    //       return null;
    //     }
    //   },
    // }),
  ],

  adapter: PrismaAdapter(prisma),
};

export default authOptions;
