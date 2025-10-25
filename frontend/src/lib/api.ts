import { supabase } from './supabase'

const API_BASE = 'http://localhost:3001'

export const api = {
  // Get auth token for API calls
  getAuthToken: async () => {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_supabase_url_here')) {
      // Return a test token for development
      return 'test-token'
    }
    
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  },

  // Upload PDF
  uploadPDF: async (file: File) => {
    const token = await api.getAuthToken()
    
    const formData = new FormData()
    formData.append('pdf', file)

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })

    return response.json()
  },

  // Chat with PDF
  chat: async (query: string) => {
    const token = await api.getAuthToken()
    
    const response = await fetch(`${API_BASE}/chat-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query })
    })

    return response.json()
  }
}
