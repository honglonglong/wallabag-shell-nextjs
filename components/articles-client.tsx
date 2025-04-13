"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Archive, Clock, Star, AlertCircle, RefreshCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getArticles } from "@/lib/wallabag-api"
import type { Article } from "@/types/article"
import ArticleActions from "./article-actions"
import { Button } from "@/components/ui/button"

interface ArticlesClientProps {
  filter: "unread" | "archived" | "starred" | "all"
}

export default function ArticlesClient({ filter }: ArticlesClientProps) {
  const { toast } = useToast()
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchArticles = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check if we have credentials before trying to fetch
      const storedUrl = localStorage.getItem("wallabag_url")
      const hasToken = localStorage.getItem("wallabag_token")

      if (!storedUrl || !hasToken) {
        setError("Missing API configuration. Please log in again.")
        setIsLoading(false)
        return
      }

      const fetchedArticles = await getArticles(filter)
      setArticles(fetchedArticles)
    } catch (err) {
      console.error("Failed to fetch articles:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(`Failed to load articles: ${errorMessage}`)
      toast({
        title: "Error",
        description: "Failed to load articles. Please check your API configuration.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Wrap in try-catch to prevent unhandled errors
    try {
      fetchArticles()
    } catch (error) {
      console.error("Error in useEffect:", error)
      setError("Failed to initialize article list")
      setIsLoading(false)
    }
  }, [filter])

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading articles...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Card>
          <CardContent className="pt-6 pb-4 flex flex-col items-center gap-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div>
              <h3 className="text-lg font-medium mb-2">Error Loading Articles</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchArticles} className="flex items-center gap-2">
                <RefreshCcw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No articles found</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <Card key={article.id} className="flex flex-col">
          <CardHeader className="pb-2">
            <Link href={`/article/${article.id}`} className="hover:underline">
              <CardTitle className="line-clamp-2">{article.title}</CardTitle>
            </Link>
            <CardDescription className="flex items-center gap-2">
              {article.domain}
              <span className="text-xs text-muted-foreground">{new Date(article.created_at).toLocaleDateString()}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-3">{article.preview}</p>
          </CardContent>
          <CardFooter className="flex justify-between pt-2 border-t">
            <div className="flex gap-1">
              {article.is_starred && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  <span className="sr-only">Starred</span>
                </Badge>
              )}
              {article.is_archived && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Archive className="h-3 w-3" />
                  <span className="sr-only">Archived</span>
                </Badge>
              )}
              {!article.is_archived && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="sr-only">Unread</span>
                </Badge>
              )}
            </div>
            <ArticleActions article={article} />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
