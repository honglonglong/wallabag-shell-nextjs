import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookMarked, Clock } from "lucide-react"
import ArticleList from "@/components/article-list"
import AddArticleForm from "@/components/add-article-form"
import { ArticleSkeleton } from "@/components/skeletons"
import UserMenu from "@/components/user-menu"
import { ErrorBoundary } from "@/components/error-boundary"

export default function Home() {
  return (
    <div className="container mx-auto py-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookMarked className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Wallabag Reader</h1>
        </div>
        <div className="flex items-center gap-2">
          <UserMenu />
        </div>
      </header>

      <ErrorBoundary
        fallback={
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center py-4">
                <p className="text-destructive">Failed to load form. Please refresh the page.</p>
              </div>
            </CardContent>
          </Card>
        }
      >
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Save Article</CardTitle>
            <CardDescription>Add a new article to your reading list</CardDescription>
          </CardHeader>
          <CardContent>
            <AddArticleForm />
          </CardContent>
        </Card>
      </ErrorBoundary>

      <Tabs defaultValue="unread" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="unread" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Unread
          </TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
          <TabsTrigger value="starred">Starred</TabsTrigger>
          <TabsTrigger value="all">All Articles</TabsTrigger>
        </TabsList>
        <TabsContent value="unread">
          <ErrorBoundary>
            <Suspense fallback={<ArticleSkeleton count={5} />}>
              <ArticleList filter="unread" />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>
        <TabsContent value="archived">
          <ErrorBoundary>
            <Suspense fallback={<ArticleSkeleton count={5} />}>
              <ArticleList filter="archived" />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>
        <TabsContent value="starred">
          <ErrorBoundary>
            <Suspense fallback={<ArticleSkeleton count={5} />}>
              <ArticleList filter="starred" />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>
        <TabsContent value="all">
          <ErrorBoundary>
            <Suspense fallback={<ArticleSkeleton count={5} />}>
              <ArticleList filter="all" />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  )
}
