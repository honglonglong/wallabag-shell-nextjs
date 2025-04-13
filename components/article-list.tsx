import { AlertCircle } from "lucide-react"
import { isApiConfigured } from "@/lib/server-api"
import ArticlesClient from "./articles-client"

interface ArticleListProps {
  filter: "unread" | "archived" | "starred" | "all"
}

export default async function ArticleList({ filter }: ArticleListProps) {
  // Check if API is configured
  const apiConfigured = await isApiConfigured()

  if (!apiConfigured) {
    return (
      <div className="text-center py-12 space-y-4">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
        <p className="text-muted-foreground">You need to configure your Wallabag API credentials</p>
        <p className="text-sm text-muted-foreground">Please check your environment variables</p>
      </div>
    )
  }

  // Use client component for data fetching
  return <ArticlesClient filter={filter} />
}
