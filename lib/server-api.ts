import { cookies } from "next/headers"

// Check if API is configured from server-side
export async function isApiConfigured(): Promise<boolean> {
  const cookieStore = cookies()
  return cookieStore.has("wallabag_setup_complete")
}

// Placeholder data for server rendering when no credentials are available
export async function getPlaceholderArticles() {
  return {
    items: [],
    isConfigured: false,
  }
}
