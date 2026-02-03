export default function BuilderHomePage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="container mx-auto px-4 py-16">
                <div className="text-center">
                    <h1 className="text-5xl font-bold text-white mb-6">
                        ProSektor <span className="text-purple-400">Builder</span>
                    </h1>
                    <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                        AI destekli web sitesi oluşturma platformuna hoş geldiniz.
                        Dakikalar içinde profesyonel web siteleri oluşturun.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <a
                            href="/projects"
                            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            Projelerim
                        </a>
                        <a
                            href="/projects/new"
                            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 transition-colors"
                        >
                            Yeni Proje
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
}
