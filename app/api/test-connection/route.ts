import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        success: false,
        error: 'OPENAI_API_KEY not found in environment variables',
      })
    }

    // Validate key format
    if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid API key format (should start with sk-)',
      })
    }

    // Test connection by listing models
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ 
        success: false,
        error: `OpenAI API error: ${errorText}`,
        status: response.status,
      })
    }

    return NextResponse.json({ 
      success: true,
      message: 'OpenAI API connection successful',
    })

  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
