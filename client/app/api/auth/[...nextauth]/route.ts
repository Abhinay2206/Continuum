import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
      authorization: { params: { scope: "read:user user:email repo" } }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const user = await prisma.user.findUnique({ 
          where: { email: credentials.email } 
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "github") {
        try {
          const email = user.email!;
          let existingUser = await prisma.user.findUnique({ where: { email } });
          
          if (!existingUser) {
            existingUser = await prisma.user.create({
              data: {
                email: email,
                name: user.name,
                image: user.image,
                githubId: account?.providerAccountId,
                workspaces: {
                  create: {
                    name: `${user.name || 'Personal'} Workspace`
                  }
                }
              }
            });
          } else if (!existingUser.githubId && account?.providerAccountId) {
            existingUser = await prisma.user.update({
              where: { email },
              data: { githubId: account.providerAccountId }
            });
          }

          const userWorkspaces = await prisma.workspace.count({ where: { userId: existingUser.id }});
          if (userWorkspaces === 0) {
            await prisma.workspace.create({
              data: {
                name: `${existingUser.name || 'Personal'} Workspace`,
                userId: existingUser.id
              }
            });
          }

          if (account.access_token) {
            const { encryptToken } = await import("@/server/lib/encryption");
            const { encryptedData, iv } = encryptToken(account.access_token);
            
            await prisma.githubAccount.upsert({
              where: { userId: existingUser.id },
              create: {
                userId: existingUser.id,
                githubId: account.providerAccountId,
                githubUsername: (profile as any)?.login || user.name || "unknown",
                encryptedToken: encryptedData,
                encryptedTokenIv: iv,
              },
              update: {
                encryptedToken: encryptedData,
                encryptedTokenIv: iv,
                githubUsername: (profile as any)?.login || user.name || "unknown",
              }
            });
          }
        } catch (error) {
          console.error("Error during GitHub sign in database sync:", error);
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "github") {
          const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
          if (dbUser) {
            token.id = dbUser.id;
          }
        } else {
          token.id = user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
