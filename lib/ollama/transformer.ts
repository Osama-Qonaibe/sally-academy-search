import { Model } from '@/lib/types/models'

import { OllamaModel, OllamaModelCapabilities } from './types'

export function transformOllamaModel(
  ollamaModel: OllamaModel,
  capabilities?: OllamaModelCapabilities
): Model | null {
  const hasTools = capabilities?.capabilities.includes('tools') || false

  if (!hasTools) {
    return null
  }

  return {
    id: ollamaModel.name,
    name: formatModelName(ollamaModel.name),
    provider: 'Ollama',
    providerId: 'ollama',
    enabled: true,
    toolCallType: 'native',
    toolCallModel: ollamaModel.name,
    capabilities: capabilities?.capabilities || [],
    contextWindow: capabilities?.contextWindow || 128_000
  }
}

function formatModelName(name: string): string {
  return name
    .replace(/[:]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
