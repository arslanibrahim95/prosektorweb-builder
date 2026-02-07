interface GalleryImage {
  image: { url: string }
  caption?: string
}

interface GallerySectionProps {
  sectionTitle?: string
  images?: GalleryImage[]
}

export function GallerySection({ sectionTitle, images }: GallerySectionProps) {
  if (!images || images.length === 0) return null

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        {sectionTitle && (
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              {sectionTitle}
            </h2>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((item, index) => (
            <div
              key={index}
              className="group relative aspect-square rounded-xl overflow-hidden bg-neutral-100"
            >
              <img
                src={item.image.url}
                alt={item.caption || `Gorsel ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {item.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm">{item.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
