import { User } from 'lucide-react'

interface TeamMember {
  name: string
  role?: string
  image?: { url: string } | null
  bio?: string
}

interface TeamSectionProps {
  sectionTitle?: string
  members?: TeamMember[]
}

export function TeamSection({ sectionTitle, members }: TeamSectionProps) {
  if (!members || members.length === 0) return null

  return (
    <section className="py-20 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            {sectionTitle || 'Ekibimiz'}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {members.map((member, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="w-24 h-24 rounded-full mx-auto mb-6 overflow-hidden bg-neutral-100">
                {member.image?.url ? (
                  <img
                    src={member.image.url}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-12 h-12 text-neutral-400" />
                  </div>
                )}
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-1">
                {member.name}
              </h3>
              {member.role && (
                <p className="text-[var(--color-primary)] font-medium mb-3">
                  {member.role}
                </p>
              )}
              {member.bio && (
                <p className="text-neutral-600 text-sm">{member.bio}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
