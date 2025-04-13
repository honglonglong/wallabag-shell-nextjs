"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Archive, MoreVertical, Star, Trash, Undo } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { toggleArchive, toggleStar, deleteArticle } from "@/lib/wallabag-api"
import type { Article } from "@/types/article"

interface ArticleActionsProps {
  article: Article
}

export default function ArticleActions({ article }: ArticleActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleArchive = async () => {
    setIsLoading(true)
    try {
      await toggleArchive(article.id, !article.is_archived)
      toast({
        title: article.is_archived ? "Article unarchived" : "Article archived",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update article status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleStar = async () => {
    setIsLoading(true)
    try {
      await toggleStar(article.id, !article.is_starred)
      toast({
        title: article.is_starred ? "Article unstarred" : "Article starred",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update article status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this article?")) return

    setIsLoading(true)
    try {
      await deleteArticle(article.id)
      toast({
        title: "Article deleted",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete article",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isLoading}>
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">More options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleToggleStar}>
          <Star className="mr-2 h-4 w-4" />
          {article.is_starred ? "Remove star" : "Star article"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggleArchive}>
          {article.is_archived ? (
            <>
              <Undo className="mr-2 h-4 w-4" />
              Unarchive
            </>
          ) : (
            <>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
