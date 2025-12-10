import { AIProvider, AIProviderType, SummarizationRequest, SummarizationResponse, TaggingRequest, TaggingResponse, EmbeddingRequest, EmbeddingResponse } from '../types'

export class MockAIProvider implements AIProvider {
  getProviderType(): AIProviderType {
    return 'mock'
  }

  getModelInfo(): string {
    return 'mock-ai-provider-v1.0'
  }

  async summarize(request: SummarizationRequest): Promise<SummarizationResponse> {
    // Simple mock summarization - take first 3 sentences
    const sentences = request.content.split(/[.!?]+/)
    const summary = sentences.slice(0, 3).join('. ') + '.'
    const truncatedSummary = summary.length > 500 ? summary.substring(0, 497) + '...' : summary

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100))

    return {
      summary: truncatedSummary,
      model: 'mock-summarizer',
    }
  }

  async generateTags(request: TaggingRequest): Promise<TaggingResponse> {
    // Simple mock tagging - extract keywords from content
    const text = (request.title + ' ' + request.content).toLowerCase()
    const words = text.split(/\W+/).filter(w => w.length > 3)

    const stopWords = new Set(['that', 'this', 'with', 'from', 'have', 'what', 'when', 'where', 'which', 'will', 'your', 'they', 'their'])

    const wordCounts: Record<string, number> = {}
    words.forEach(word => {
      if (!stopWords.has(word)) {
        wordCounts[word] = (wordCounts[word] || 0) + 1
      }
    })

    const topWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, request.maxTags || 5)
      .map(([word]) => word)

    const allTags = [...new Set([...(request.existingTags || []), ...topWords])]

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 50))

    return {
      tags: allTags,
      confidence: 0.8,
      model: 'mock-tagger',
    }
  }

  async generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    // Generate deterministic pseudo-embeddings
    const text = request.content.substring(0, 1000)
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2)
    const uniqueWords = [...new Set(words)]

    const embeddingSize = 384
    const embeddings = new Array(embeddingSize).fill(0)

    uniqueWords.forEach((word, i) => {
      const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const seed = (hash + i) % embeddingSize
      embeddings[seed] = (embeddings[seed] + 1) / (uniqueWords.length + 1)
    })

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 200))

    return {
      embeddings,
      model: 'mock-embedder',
    }
  }

  async healthCheck(): Promise<boolean> {
    // Mock provider is always healthy
    return true
  }
}