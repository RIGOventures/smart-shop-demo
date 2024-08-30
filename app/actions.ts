'use server'

import { type Chat } from '@/lib/types'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { kv } from '@vercel/kv'

import { auth } from '@/auth'

export async function getChats(userId?: string | null) {
    const session = await auth()

    if (!userId) {
        return []
    }

    if (userId !== session?.user?.id) {
        return {
            error: 'Unauthorized'
        }
    }

    try {
        const pipeline = kv.pipeline()
        // Fetch all the chats stored with the user in reverse order
        const chats: string[] = await kv.zrange(`user:chat:${userId}`, 0, -1, {
            rev: true
        })

        // Get all chats saved
        for (const chat of chats) {
            pipeline.hgetall(chat)
        }

        const results = await pipeline.exec()

        return results as Chat[]
    } catch (error) {
        return []
    }
}

export async function getChat(id: string, userId: string) {
    const session = await auth()
    
    if (userId !== session?.user?.id) {
        return {
            error: 'Unauthorized'
        }
    }

    const chat = await kv.hgetall<Chat>(`chat:${id}`)

    if (!chat || (userId && chat.userId !== userId)) {
        return null
    }

    return chat
}

export async function removeChat({ id, path }: { id: string; path: string }) {
    const session = await auth()

    if (!session) {
        return {
            error: 'Unauthorized'
        }
    }

    // Convert uid to string for consistent comparison with session.user.id
    const uid = String(await kv.hget(`chat:${id}`, 'userId'))

    if (uid !== session?.user?.id) {
        return {
            error: 'Unauthorized'
        }
    }

    await kv.del(`chat:${id}`)
    await kv.zrem(`user:chat:${session.user.id}`, `chat:${id}`)

    revalidatePath('/')
    return revalidatePath(path)
}

export async function clearChats() {
    const session = await auth()

    if (!session?.user?.id) {
        return {
            error: 'Unauthorized'
        }
    }

    const chats: string[] = await kv.zrange(`user:chat:${session.user.id}`, 0, -1)
    if (!chats.length) {
        return redirect('/')
    }
    const pipeline = kv.pipeline()

    for (const chat of chats) {
        pipeline.del(chat)
        pipeline.zrem(`user:chat:${session.user.id}`, chat)
    }

    await pipeline.exec()

    revalidatePath('/')
    return redirect('/')
}

export async function getSharedChat(id: string) {
    const chat = await kv.hgetall<Chat>(`chat:${id}`)

    if (!chat || !chat.sharePath) {
        return null
    }

    return chat
}

export async function shareChat(id: string) {
    const session = await auth()

    if (!session?.user?.id) {
        return {
            error: 'Unauthorized'
        }
    }

    const chat = await kv.hgetall<Chat>(`chat:${id}`)

    if (!chat || chat.userId !== session.user.id) {
        return {
            error: 'Something went wrong'
        }
    }

    const payload = {
        ...chat,
        sharePath: `/share/${chat.id}`
    }

    await kv.hset(`chat:${chat.id}`, payload)

    return payload
}

export async function saveChat(chat: Chat) {
    const session = await auth()

    if (session && session.user) {
        const pipeline = kv.pipeline()

        pipeline.hset(`chat:${chat.id}`, chat)
        pipeline.zadd(`user:chat:${chat.userId}`, {
            score: Date.now(), // Sort by date
            member: `chat:${chat.id}` // The actual value
        })

        await pipeline.exec()
    } else {
        return
    }
}

export async function refreshHistory(path: string) {
    redirect(path)
}

const keysRequired = [
    'GOOGLE_VERTEX_PROJECT',
    'GOOGLE_VERTEX_LOCATION',
    'GOOGLE_APPLICATION_CREDENTIALS',
    'KROGER_CLIENT_ID',
    'KROGER_CLIENT_SECRET',
    'WALGREENS_API_KEY', 
    'SPOONACULAR_API_KEY', 
    'UPC_DATABASE_API_KEY', 
]

export async function getMissingKeys() {
    return keysRequired
        .map(key => (process.env[key] ? '' : key))
        .filter(key => key !== '')
}