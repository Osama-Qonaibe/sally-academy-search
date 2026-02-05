import { NextResponse } from 'next/server'

import { OllamaClient } from '@/lib/ollama/client'
import { transformOllamaModel } from '@/lib/ollama/transformer'

export async function GET() {
  const ollamaUrl = process.env.OLLAMA_BASE_URL
  const ollamaApiKey = process.env.OLLAMA_API_KEY
  
  if (!ollamaUrl) {
    return NextResponse.json({ models: [] })
  }

  try {
    const client = new OllamaClient(ollamaUrl, ollamaApiKey)
    const ollamaModels = await client.getModels()

    const models = []
    for (const ollamaModel of ollamaModels) {
      try {
        const capabilities = await client.getModelCapabilities(ollamaModel.name)
        const transformedModel = transformOllamaModel(ollamaModel, capabilities)
        if (transformedModel) {
          models.push(transformedModel)
        }
      } catch {
        continue
      }
    }

    return NextResponse.json({ models })
  } catch {
    return NextResponse.json({ models: [] })
  }
}
