import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSiteData, getSiteBlogPosts } from '@/features/sites/lib/site-data';
import { Calendar, ArrowRight } from 'lucide-react';

interface BlogPageProps {
  params: Promise<{ siteSlug: string }>;
}

export async function generateMetadata({ params }: BlogPageProps) {
  const { siteSlug } = await params;
  const siteData = await getSiteData(siteSlug);

  if (!siteData) {
    return { title: 'Blog' };
  }

  return {
    title: `Blog | ${siteData.company.name}`,
    description: `${siteData.company.name} blog yazilari - Is Sagligi ve Guvenligi hakkinda guncel bilgiler`,
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { siteSlug } = await params;
  const siteData = await getSiteData(siteSlug);

  if (!siteData) {
    notFound();
  }

  const posts = await getSiteBlogPosts(siteData.project.id);

  return (
    <>
      {/* Page Header */}
      <section className="py-16 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Is sagligi ve guvenligi hakkinda guncel yazilar ve bilgiler
          </p>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-neutral-500">Henuz blog yazisi bulunmuyor.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => {
                const coverUrl =
                  post.coverImage && typeof post.coverImage === 'object'
                    ? (post.coverImage as { url?: string }).url
                    : null;

                return (
                  <article
                    key={post.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                  >
                    {coverUrl && (
                      <div className="aspect-video">
                        <img
                          src={coverUrl}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-sm text-neutral-500 mb-3">
                        <Calendar className="w-4 h-4" />
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : new Date(post.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                      <h2 className="text-xl font-semibold text-neutral-900 mb-3 line-clamp-2">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-neutral-600 mb-4 line-clamp-3">{post.excerpt}</p>
                      )}
                      <Link
                        href={`/${siteSlug}/blog/${post.slug}`}
                        className="inline-flex items-center gap-2 text-[var(--color-primary)] font-medium hover:gap-3 transition-all"
                      >
                        Devamini Oku
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
