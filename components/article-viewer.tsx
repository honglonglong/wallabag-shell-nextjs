"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Archive,
  ExternalLink,
  Star,
  Trash,
  Edit,
  Check,
  X,
  MessageSquare,
  Eye,
  EyeOff,
  Settings,
  RefreshCcw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  getArticle,
  toggleArchive,
  toggleStar,
  deleteArticle,
  updateAnnotation,
  getAnnotations,
  deleteAnnotation,
} from "@/lib/wallabag-api"
import { useMobile } from "@/hooks/use-mobile"
import type { Article, Annotation } from "@/types/article"

interface ArticleViewerProps {
  articleId: string
}

export default function ArticleViewer({ articleId }: ArticleViewerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const isMobile = useMobile()
  const contentRef = useRef<HTMLDivElement>(null)
  const [article, setArticle] = useState<Article | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null)
  const [editedText, setEditedText] = useState("")
  const [debugMessages, setDebugMessages] = useState<string[]>([])
  const [simpleView, setSimpleView] = useState(false)
  const [plainTextContent, setPlainTextContent] = useState("")
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Enhanced debug logging
  const addDebugMessage = (message: string) => {
    console.log(`[DEBUG] ${message}`)
    setDebugMessages((prev) => [message, ...prev.slice(0, 9)]) // Keep last 10 messages
  }

  useEffect(() => {
    addDebugMessage("Component mounted")

    const fetchArticle = async () => {
      try {
        setIsLoading(true)
        addDebugMessage(`Fetching article with ID: ${articleId}`)
        const fetchedArticle = await getArticle(articleId)
        setArticle(fetchedArticle)

        // Create a plain text version of the content
        if (fetchedArticle) {
          const tempDiv = document.createElement("div")
          tempDiv.innerHTML = fetchedArticle.content

          // Extract text content
          const extractedText = tempDiv.textContent || tempDiv.innerText || ""

          // Format the text with paragraphs
          const formattedText = extractedText
            .split("\n")
            .filter((line) => line.trim() !== "")
            .map((line) => `<p>${line}</p>`)
            .join("\n")

          setPlainTextContent(formattedText)
          addDebugMessage("Plain text content extracted")
        }

        setError(null)
        addDebugMessage("Article fetched successfully")

        // Fetch annotations for this article
        if (fetchedArticle) {
          try {
            addDebugMessage("Fetching annotations")
            const fetchedAnnotations = await getAnnotations(articleId)
            setAnnotations(fetchedAnnotations)
            addDebugMessage(`Fetched ${fetchedAnnotations.length} annotations`)
          } catch (annotationError) {
            console.error("Failed to fetch annotations:", annotationError)
          }
        }
      } catch (err) {
        console.error("Failed to fetch article:", err)
        setError("Failed to load article. Please check your API configuration.")
        toast({
          title: "Error",
          description: "Failed to load article. Please check your API configuration.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchArticle()
  }, [articleId, toast, retryCount])

  const handleToggleArchive = async () => {
    if (!article) return

    setIsActionLoading(true)
    try {
      await toggleArchive(article.id, !article.is_archived)
      setArticle({
        ...article,
        is_archived: !article.is_archived,
      })
      toast({
        title: article.is_archived ? "Article unarchived" : "Article archived",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update article status",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleToggleStar = async () => {
    if (!article) return

    setIsActionLoading(true)
    try {
      await toggleStar(article.id, !article.is_starred)
      setArticle({
        ...article,
        is_starred: !article.is_starred,
      })
      toast({
        title: article.is_starred ? "Article unstarred" : "Article starred",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update article status",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!article) return
    if (!confirm("Are you sure you want to delete this article?")) return

    setIsActionLoading(true)
    try {
      await deleteArticle(article.id)
      toast({
        title: "Article deleted",
      })
      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete article",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteAnnotation = async (annotationId: string) => {
    if (!confirm("Are you sure you want to delete this annotation?")) return

    setIsActionLoading(true)
    try {
      await deleteAnnotation(annotationId)

      // Update local state
      setAnnotations(annotations.filter((a) => a.id !== annotationId))

      toast({
        title: "Annotation deleted",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete annotation",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleEditAnnotation = (annotation: Annotation) => {
    setEditingAnnotation(annotation.id)
    setEditedText(annotation.text)
  }

  const handleSaveEditedAnnotation = async (annotationId: string) => {
    if (!editedText.trim()) return

    setIsActionLoading(true)
    try {
      await updateAnnotation(annotationId, editedText)

      // Update local state
      setAnnotations(annotations.map((a) => (a.id === annotationId ? { ...a, text: editedText } : a)))

      toast({
        title: "Annotation updated",
      })
      setEditingAnnotation(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update annotation",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const cancelEditAnnotation = () => {
    setEditingAnnotation(null)
    setEditedText("")
  }

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    setError(null)
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to list
            </Link>
          </Button>
        </div>
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to list
            </Link>
          </Button>
        </div>
        <Card className="p-6">
          <div className="text-center py-12 space-y-4">
            <p className="text-destructive">{error || "Article not found"}</p>
            <Button onClick={handleRetry} className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" asChild>
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to list
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            title={showDebugPanel ? "Hide debug panel" : "Show debug panel"}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant={article.is_starred ? "default" : "outline"}
            size="icon"
            onClick={handleToggleStar}
            disabled={isActionLoading}
          >
            <Star className={`h-4 w-4 ${article.is_starred ? "fill-current" : ""}`} />
            <span className="sr-only">{article.is_starred ? "Unstar" : "Star"}</span>
          </Button>
          <Button
            variant={article.is_archived ? "default" : "outline"}
            size="icon"
            onClick={handleToggleArchive}
            disabled={isActionLoading}
          >
            <Archive className="h-4 w-4" />
            <span className="sr-only">{article.is_archived ? "Unarchive" : "Archive"}</span>
          </Button>
          <Button variant="outline" size="icon" onClick={handleDelete} disabled={isActionLoading}>
            <Trash className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </div>

      {/* Debug Panel - Hidden by default */}
      {showDebugPanel && (
        <Card className="mb-4">
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Debug Panel</h3>
              <div className="flex items-center space-x-2">
                <Label htmlFor="simple-mode" className="text-xs">
                  Simple View
                </Label>
                <Switch id="simple-mode" checked={simpleView} onCheckedChange={setSimpleView} />
              </div>
            </div>

            <div className="text-xs font-mono bg-muted p-2 rounded max-h-32 overflow-y-auto">
              <p className="font-medium mb-1">Debug Messages:</p>
              <div className="space-y-1">
                {debugMessages.map((msg, i) => (
                  <p key={i} className="break-all">
                    {msg}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Reading Mode Toggle */}
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSimpleView(!simpleView)}
          className="flex items-center gap-2"
        >
          {simpleView ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          {simpleView ? "Original View" : "Simple View"}
        </Button>
      </div>

      {/* Article Content */}
      <Card className="mb-6">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-2">{article.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <span>{new Date(article.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground"
            >
              {article.domain}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Content with view toggle */}
          <div ref={contentRef} className="prose dark:prose-invert max-w-none">
            {simpleView ? (
              // Simple view - just paragraphs of text
              <div className="simple-content" dangerouslySetInnerHTML={{ __html: plainTextContent }} />
            ) : (
              // Original content
              <div className="original-content" dangerouslySetInnerHTML={{ __html: article.content }} />
            )}
          </div>
        </div>
      </Card>

      {/* Annotations Section */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Annotations
            <span className="text-sm text-muted-foreground font-normal">({annotations.length})</span>
          </h2>

          {annotations.length === 0 ? (
            <p className="text-muted-foreground">No annotations yet.</p>
          ) : (
            <div className="space-y-4">
              {annotations.map((item) => (
                <div key={item.id} className="border rounded-md p-4 bg-card hover:bg-accent/5 transition-colors">
                  <div className="bg-muted p-3 rounded-md mb-3">
                    <p className="italic text-sm">{item.quote}</p>
                  </div>

                  {editingAnnotation === item.id ? (
                    <div className="space-y-2">
                      <Textarea value={editedText} onChange={(e) => setEditedText(e.target.value)} className="w-full" />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={cancelEditAnnotation} disabled={isActionLoading}>
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEditedAnnotation(item.id)}
                          disabled={isActionLoading || !editedText.trim()}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p>{item.text}</p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAnnotation(item)}
                            disabled={isActionLoading}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAnnotation(item.id)}
                            disabled={isActionLoading}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
