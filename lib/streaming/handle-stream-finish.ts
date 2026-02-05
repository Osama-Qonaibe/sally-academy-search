import { CoreMessage, DataStreamWriter, JSONValue, Message } from 'ai'

import { getChat, saveChat } from '@/lib/actions/chat'
import { generateRelatedQuestions } from '@/lib/agents/generate-related-questions'
import { generateTitle } from '@/lib/agents/generate-title'
import { ExtendedCoreMessage } from '@/lib/types'
import { convertToExtendedCoreMessages } from '@/lib/utils'

interface HandleStreamFinishParams {
  responseMessages: CoreMessage[]
  originalMessages: Message[]
  model: string
  chatId: string
  dataStream: DataStreamWriter
  userId: string
  skipRelatedQuestions?: boolean
  annotations?: ExtendedCoreMessage[]
}

export async function handleStreamFinish({
  responseMessages,
  originalMessages,
  model,
  chatId,
  dataStream,
  userId,
  skipRelatedQuestions = false,
  annotations = []
}: HandleStreamFinishParams) {
  try {
    const extendedCoreMessages = convertToExtendedCoreMessages(originalMessages)
    let allAnnotations = [...annotations]

    if (!skipRelatedQuestions) {
      const relatedQuestionsAnnotation: JSONValue = {
        type: 'related-questions',
        data: { items: [] }
      }
      dataStream.writeMessageAnnotation(relatedQuestionsAnnotation)

      const relatedQuestions = await generateRelatedQuestions(
        responseMessages,
        model
      )

      const updatedRelatedQuestionsAnnotation: ExtendedCoreMessage = {
        role: 'data',
        content: {
          type: 'related-questions',
          data: relatedQuestions.object
        } as JSONValue
      }

      dataStream.writeMessageAnnotation(
        updatedRelatedQuestionsAnnotation.content as JSONValue
      )
      allAnnotations.push(updatedRelatedQuestionsAnnotation)
    }

    const generatedMessages = [
      ...extendedCoreMessages,
      ...responseMessages.slice(0, -1),
      ...allAnnotations,
      ...responseMessages.slice(-1)
    ] as ExtendedCoreMessage[]

    if (process.env.ENABLE_SAVE_CHAT_HISTORY !== 'true') {
      return
    }

    const savedChat = await getChat(chatId, userId)
    
    let chatTitle = ''
    if (!savedChat) {
      const firstUserMessage = originalMessages.find(m => m.role === 'user')
      if (firstUserMessage) {
        const content = typeof firstUserMessage.content === 'string' 
          ? firstUserMessage.content 
          : JSON.stringify(firstUserMessage.content)
        chatTitle = await generateTitle(content, model)
      } else {
        chatTitle = 'New Chat'
      }
    }

    await saveChat(
      {
        ...(savedChat || {
          id: chatId,
          userId: userId,
          path: `/search/${chatId}`,
          createdAt: new Date()
        }),
        title: savedChat?.title || chatTitle,
        messages: generatedMessages
      },
      userId
    ).catch(error => {
      console.error('Failed to save chat:', error)
      throw new Error('Failed to save chat history')
    })
  } catch (error) {
    console.error('Error in handleStreamFinish:', error)
    throw error
  }
}
