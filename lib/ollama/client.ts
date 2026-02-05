import {
  OllamaModel,
  OllamaModelCapabilities,
  OllamaModelsResponse,
  OllamaShowResponse
} from './types'

export class OllamaClient {
  private baseUrl: string
  private apiKey?: string

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      Accept: 'application/json'
    }
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }
    return headers
  }

  async getModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        cache: 'no-store',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(
          `Ollama API error: ${response.status} ${response.statusText}`
        )
      }

      const data: OllamaModelsResponse = await response.json()
      return data.models || []
    } catch (error) {
      console.error('Failed to fetch Ollama models:', error)
      throw error
    }
  }

  async getModelCapabilities(
    modelName: string
  ): Promise<OllamaModelCapabilities> {
    try {
      const response = await fetch(`${this.baseUrl}/api/show`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getHeaders()
        },
        body: JSON.stringify({ name: modelName })
      })

      if (!response.ok) {
        throw new Error(
          `Ollama API error: ${response.status} ${response.statusText}`
        )
      }

      const data: OllamaShowResponse = await response.json()
      return {
        name: data.name,
        capabilities: data.capabilities || [],
        contextWindow: data.context_window || 128_000,
        parameters: data.parameters || {}
      }
    } catch (error) {
      console.error(`Failed to get capabilities for ${modelName}:`, error)
      throw error
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        cache: 'no-store',
        headers: this.getHeaders()
      })
      return response.ok
    } catch (error) {
      return false
    }
  }
}
