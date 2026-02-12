import { getPayloadInstance } from '@/lib/payload';
import { notFound } from 'next/navigation';
import { 
  MessageSquare, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  ChevronRight,
  Search,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface MesajlarPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function MesajlarPage({ params }: MesajlarPageProps) {
  const { projectId } = await params;
  const payload = await getPayloadInstance();

  // Fetch standard contact submissions
  const { docs: messages } = await payload.find({
    collection: 'contact-submissions',
    where: {
      'project.id': { equals: projectId },
    },
    sort: '-createdAt',
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Gelen Mesajlar</h1>
          <p className="text-neutral-500 text-sm mt-1">
            İletişim formları üzerinden gelen tüm mesajları buradan yönetebilirsiniz.
          </p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Mesajlarda ara..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>
        </div>

        <div className="divide-y divide-neutral-100">
          {messages.length > 0 ? (
            messages.map((msg: any) => (
              <div key={msg.id} className="p-5 hover:bg-neutral-50 transition-all group cursor-pointer">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      msg.status === 'unread' ? 'bg-brand-50 text-brand-600' : 'bg-neutral-100 text-neutral-400'
                    }`}>
                      {msg.status === 'unread' ? <MessageSquare className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-bold truncate ${msg.status === 'unread' ? 'text-neutral-900' : 'text-neutral-500'}`}>
                          {msg.name}
                        </h3>
                        {msg.status === 'unread' && (
                          <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0" />
                        )}
                      </div>
                      <p className={`text-sm line-clamp-1 mb-2 ${msg.status === 'unread' ? 'text-neutral-700' : 'text-neutral-400'}`}>
                        <span className="font-semibold">{msg.subject}:</span> {msg.message}
                      </p>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1 text-xs text-neutral-400">
                          <Mail className="w-3.5 h-3.5" />
                          {msg.email}
                        </div>
                        {msg.phone && (
                          <div className="flex items-center gap-1 text-xs text-neutral-400">
                            <Phone className="w-3.5 h-3.5" />
                            {msg.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium justify-end mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(msg.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                        msg.status === 'unread' ? 'bg-brand-100 text-brand-700' : 'bg-neutral-100 text-neutral-500'
                      }`}>
                        {msg.status === 'unread' ? 'Yeni Mesaj' : 'Okundu'}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-neutral-600 transition-colors" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-neutral-200" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">Mesaj Kutunuz Boş</h3>
              <p className="text-neutral-500">Henüz bir mesaj almadınız. Siteniz yayına girdiğinde burada görünecektir.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
