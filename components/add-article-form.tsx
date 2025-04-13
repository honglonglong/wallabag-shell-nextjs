"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { addArticle } from "@/lib/wallabag-api"

export default function AddArticleForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) return

    setIsLoading(true)
    try {
      await addArticle(url)
      toast({
        title: "Article saved",
        description: "The article has been added to your reading list.",
      })
      setUrl("")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save article. Please check the URL and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="url"
        placeholder="https://example.com/article"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
        className="flex-1"
      />
      <Button type="submit" disabled={isLoading || !url.trim()}>
        {isLoading ? "Saving..." : "Save"}
      </Button>
    </form>
  )
}
