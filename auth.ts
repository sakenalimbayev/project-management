import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user?.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? [user.firstName, user.lastName].filter(Boolean).join(" "),
          image: user.image ?? user.avatar ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, profile }) {
      // Keep avatar/image in sync for OAuth users
      const image =
        (user?.image as string | null | undefined) ??
        (profile && "picture" in profile ? (profile.picture as string | undefined) : undefined);

      if (user?.email && image) {
        await prisma.user.updateMany({
          where: { email: user.email },
          data: { avatar: image, image },
        });
      }

      return true;
    },
  },
});
