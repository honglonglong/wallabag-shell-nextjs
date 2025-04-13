export interface Article {
  id: string
  title: string
  url: string
  content: string
  preview: string
  domain: string
  created_at: string
  is_archived: boolean
  is_starred: boolean
  annotations: Annotation[]
}

export interface Annotation {
  id: string
  text: string
  quote: string
  created_at: string
  ranges?: {
    start: string
    startOffset: number
    end: string
    endOffset: number
  }[]
}
