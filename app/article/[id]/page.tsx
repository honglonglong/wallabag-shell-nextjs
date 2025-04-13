import { Suspense } from "react"
import { notFound } from "next/navigation"
import ArticleViewer from "@/components/article-viewer"
import { ArticleViewerSkeleton } from "@/components/skeletons"
import { isApiConfigured } from "@/lib/server-api"

interface ArticlePageProps {
  params: {
    id: string
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  // Check if API is configured
  const apiConfigured = await isApiConfigured()

  if (!apiConfigured) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<ArticleViewerSkeleton />}>
        <ArticleContent id={params.id} />
      </Suspense>
    </div>
  )
}

function ArticleContent({ id }: { id: string }) {
  // We'll use client-side data fetching in the ArticleViewer component
  return <ArticleViewer articleId={id} />
}
