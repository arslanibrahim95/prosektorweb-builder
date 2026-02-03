import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { auth } from '@/auth'

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { id } = params
        const { content } = await request.json()

        // Update the content in the database
        const updatedContent = await prisma.generatedContent.update({
            where: { id },
            data: {
                content,
                status: 'REVIEW' // Back to review if edited by customer? Or keep as is.
            }
        })

        return NextResponse.json(updatedContent)
    } catch (error) {
        console.error('Portal Content Update Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
