export async function testOpenAIConnection(apiKey: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })
    
    if (!response.ok) {
      const error = await response.text()
      return { success: false, error }
    }
    
    return { success: true, data: await response.json() }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export function validateOpenAIKey(apiKey: string): boolean {
  return apiKey.startsWith('sk-') && apiKey.length > 20
}
