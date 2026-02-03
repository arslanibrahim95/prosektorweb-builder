import NextAuth from "next-auth"

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [],
    callbacks: {
        session({ session, token }: any) {
            if (session.user && token.sub) {
                session.user.id = token.sub
            }
            return session
        },
    },
})
