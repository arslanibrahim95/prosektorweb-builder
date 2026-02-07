import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSiteData, getSiteBlogPost, getSiteBlogPosts } from '@/features/sites/lib/site-data';
import { Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import type { BlogPost, Media } from '@/payload-types';

interface BlogPostPageProps {
  params: Promise<{ siteSlug: string; postSlug: string }>;
}

function getMediaUrl(media: BlogPost['coverImage']): string | null {
  if (!media) return null;
  if (typeof media === 'object' && 'url' in media) {
    return (media as Media).url || null;
  }
  return null;
}

function lexicalToParagraphs(content: BlogPost['content']): string[] {
  if (!content?.root?.children || !Array.isArray(content.root.children)) return [];

  const paragraphs: string[] = [];

  for (const child of content.root.children) {
    if (!child || typeof child !== 'object') continue;
    if (!('children' in child) || !Array.isArray(child.children)) continue;

    const text = child.children
      .map((node) => {
        if (!node || typeof node !== 'object') return '';
        if ('text' in node && typeof node.text === 'string') return node.text;
        return '';
      })
      .join('')
      .trim();

    if (text) paragraphs.push(text);
  }

  return paragraphs;
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { siteSlug, postSlug } = await params;
  const siteData = await getSiteData(siteSlug);

  if (!siteData) {
    return { title: 'Blog Yazisi' };
  }

  const post = await getSiteBlogPost(siteData.project.id, postSlug);

  if (!post) {
    return { title: 'Yazi Bulunamadi' };
  }

  return {
    title: `${post.title} | ${siteData.company.name}`,
    description: post.excerpt || `${post.title} - ${siteData.company.name} blog`,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { siteSlug, postSlug } = await params;
  const siteData = await getSiteData(siteSlug);

  if (!siteData) {
    notFound();
  }

  const post = await getSiteBlogPost(siteData.project.id, postSlug);

  if (!post) {
    notFound();
  }

  // Get related posts
  const allPosts = await getSiteBlogPosts(siteData.project.id, 4);
  const relatedPosts = allPosts.filter((p) => p.id !== post.id).slice(0, 3);
  const coverImageUrl = getMediaUrl(post.coverImage);
  const contentParagraphs = lexicalToParagraphs(post.content);

  return (
    <>
      {/* Page Header */}
      <section className="py-16 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white">
        <div className="container mx-auto px-4">
          <Link
            href={`/${siteSlug}/blog`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Blog'a Don
          </Link>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 max-w-4xl">
            {post.title}
          </h1>
          <div className="flex items-center gap-2 text-white/80">
            <Calendar className="w-5 h-5" />
            {post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : new Date(post.createdAt).toLocaleDateString('tr-TR')}
          </div>
        </div>
      </section>

      {/* Post Content */}
      <article className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {coverImageUrl && (
              <div className="aspect-video rounded-2xl overflow-hidden mb-8">
                <img
                  src={coverImageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {post.excerpt && (
              <p className="text-xl text-neutral-600 mb-8 font-medium">{post.excerpt}</p>
            )}

            <div className="prose prose-lg max-w-none prose-headings:text-neutral-900 prose-p:text-neutral-600 prose-a:text-[var(--color-primary)]">
              {contentParagraphs.map((paragraph, index) => (
                <p key={`${post.id}-${index}`}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 bg-neutral-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-neutral-900 mb-8">Diger Yazilar</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <article
                  key={relatedPost.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                >
                  {getMediaUrl(relatedPost.coverImage) && (
                    <div className="aspect-video">
                      <img
                        src={getMediaUrl(relatedPost.coverImage) || ''}
                        alt={relatedPost.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-3 line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    <Link
                      href={`/${siteSlug}/blog/${relatedPost.slug}`}
                      className="inline-flex items-center gap-2 text-[var(--color-primary)] font-medium hover:gap-3 transition-all"
                    >
                      Oku
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
