-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "canonicalUrl" TEXT,
    "category" TEXT NOT NULL,
    "categorySlug" TEXT,
    "author" TEXT NOT NULL DEFAULT 'AJ Travels Editorial Team',
    "publishedAt" TIMESTAMP(3),
    "readTime" TEXT DEFAULT '5 min read',
    "featuredImage" TEXT NOT NULL DEFAULT '/assets/pune-to-mumbai-premium-travel-banner.webp',
    "imageAlt" TEXT,
    "summary" TEXT NOT NULL,
    "pickupDefault" TEXT DEFAULT 'pune',
    "dropDefault" TEXT DEFAULT 'mumbai',
    "content" JSONB NOT NULL,
    "faqs" JSONB,
    "relatedPosts" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_isPublished_idx" ON "blog_posts"("isPublished");

-- CreateIndex
CREATE INDEX "blog_posts_category_idx" ON "blog_posts"("category");

-- CreateIndex
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts"("slug");

