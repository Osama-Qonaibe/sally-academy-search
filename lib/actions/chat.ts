'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { type Chat } from '@/lib/types'

export async function getChats(userId?: string | null) {
  if (!userId || userId === 'anonymous') {
    return []
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching chats:', error)
    return []
  }
}

export async function getChatsPage(
  userId: string,
  limit = 20,
  offset = 0
): Promise<{ chats: Chat[]; nextOffset: number | null }> {
  if (userId === 'anonymous') {
    return { chats: [], nextOffset: null }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('chats')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const chats = (data || []).map(chat => ({
      ...chat,
      id: chat.id,
      title: chat.title,
      userId: chat.user_id,
      messages: [],
      createdAt: new Date(chat.created_at)
    }))

    const nextOffset = data && data.length === limit ? offset + limit : null
    return { chats, nextOffset }
  } catch (error) {
    console.error('Error fetching chat page:', error)
    return { chats: [], nextOffset: null }
  }
}

export async function getChat(id: string, userId: string = 'anonymous') {
  if (userId === 'anonymous') {
    return null
  }

  try {
    const supabase = await createClient()
    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (chatError) throw chatError
    if (!chatData) return null

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', id)
      .order('created_at', { ascending: true })

    if (msgError) throw msgError

    return {
      ...chatData,
      id: chatData.id,
      title: chatData.title,
      userId: chatData.user_id,
      messages: (messages || []).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      createdAt: new Date(chatData.created_at)
    }
  } catch (error) {
    console.error('Error fetching chat:', error)
    return null
  }
}

export async function clearChats(
  userId: string = 'anonymous'
): Promise<{ error?: string }> {
  if (userId === 'anonymous') {
    return { error: 'Cannot clear chats for anonymous users' }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('user_id', userId)

    if (error) throw error

    revalidatePath('/')
    redirect('/')
  } catch (error) {
    console.error('Error clearing chats:', error)
    return { error: 'Failed to clear chats' }
  }
}

export async function deleteChat(
  chatId: string,
  userId = 'anonymous'
): Promise<{ error?: string }> {
  if (userId === 'anonymous') {
    return { error: 'Cannot delete chats for anonymous users' }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)
      .eq('user_id', userId)

    if (error) throw error

    revalidatePath('/')
    return {}
  } catch (error) {
    console.error(`Error deleting chat ${chatId}:`, error)
    return { error: 'Failed to delete chat' }
  }
}

export async function saveChat(chat: Chat, userId: string = 'anonymous') {
  if (userId === 'anonymous') {
    return { success: false, message: 'Anonymous users cannot save chats' }
  }

  try {
    const supabase = await createClient()
    
    const { data: existingChat } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chat.id)
      .single()

    const chatData = {
      id: chat.id,
      user_id: userId,
      title: chat.title,
      created_at: chat.createdAt || new Date(),
      updated_at: new Date()
    }

    if (existingChat) {
      const { error: updateError } = await supabase
        .from('chats')
        .update(chatData)
        .eq('id', chat.id)

      if (updateError) throw updateError
    } else {
      const { error: insertError } = await supabase
        .from('chats')
        .insert(chatData)

      if (insertError) throw insertError
    }

    if (chat.messages && chat.messages.length > 0) {
      const messagesToInsert = chat.messages.map((msg, index) => {
        const msgId = `${chat.id}-${index}-${Date.now()}`
        return {
          id: msgId,
          chat_id: chat.id,
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
          created_at: new Date()
        }
      })

      const { error: msgError } = await supabase
        .from('messages')
        .upsert(messagesToInsert, { onConflict: 'id' })

      if (msgError) throw msgError
    }

    return { success: true }
  } catch (error) {
    console.error('Error saving chat:', error)
    throw error
  }
}

export async function getSharedChat(id: string) {
  try {
    const supabase = await createClient()
    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', id)
      .single()

    if (chatError) throw chatError
    if (!chatData) return null

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', id)
      .order('created_at', { ascending: true })

    if (msgError) throw msgError

    return {
      ...chatData,
      userId: chatData.user_id,
      messages: (messages || []).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      createdAt: new Date(chatData.created_at)
    }
  } catch (error) {
    return null
  }
}

export async function shareChat(id: string, userId: string = 'anonymous') {
  if (userId === 'anonymous') {
    return null
  }

  try {
    const supabase = await createClient()
    const sharePath = `/share/${id}`
    
    const { data, error } = await supabase
      .from('chats')
      .update({ updated_at: new Date() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    if (!data) return null

    return {
      ...data,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      sharePath: sharePath
    }
  } catch (error) {
    console.error('Error sharing chat:', error)
    return null
  }
}
