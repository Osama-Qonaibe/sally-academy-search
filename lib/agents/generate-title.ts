import { generateText } from 'ai'
import { getModel } from '../utils/registry'

export async function generateTitle(
  userMessage: string,
  modelId: string = 'groq:llama-3.1-8b-instant'
): Promise<string> {
  try {
    const model = getModel(modelId)

    if (!model) {
      return userMessage.slice(0, 100)
    }

    const { text } = await generateText({
      model,
      system: `You are a title generator. Generate a concise, descriptive title (3-6 words) for a chat conversation based on the user's first message. 
      
Rules:
- Maximum 6 words
- No quotes or special characters
- Capture the main topic
- Be specific and clear
- Use title case`,
      prompt: `Generate a title for this message: "${userMessage}"`
    })

    const title = text.trim().replace(/["']/g, '')
    return title.length > 0 ? title : userMessage.slice(0, 100)
  } catch (error) {
    console.error('Error generating title:', error)
    return userMessage.slice(0, 100)
  }
}
