"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Eye, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Mock pages
const mockPages = [
    {
        id: "1",
        name: "Ana Sayfa",
        slug: "/",
        content: `<h1>OSGB Hizmetleri</h1>
<p>İş sağlığı ve güvenliği alanında profesyonel çözümler sunuyoruz.</p>
<h2>Hizmetlerimiz</h2>
<ul>
  <li>İşyeri Hekimliği</li>
  <li>İş Güvenliği Uzmanlığı</li>
  <li>Risk Değerlendirmesi</li>
</ul>`
    },
    {
        id: "2",
        name: "Hakkımızda",
        slug: "/hakkimizda",
        content: `<h1>Hakkımızda</h1>
<p>Firmamız hakkında detaylı bilgi...</p>`
    },
    {
        id: "3",
        name: "Hizmetler",
        slug: "/hizmetler",
        content: `<h1>Hizmetlerimiz</h1>
<p>Sunduğumuz hizmetler...</p>`
    },
    {
        id: "4",
        name: "İletişim",
        slug: "/iletisim",
        content: `<h1>İletişim</h1>
<p>Bizimle iletişime geçin...</p>`
    },
];

export default function EditorPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const projectId = params.id as string;
    const pageIdParam = searchParams.get("page");

    const [selectedPageId, setSelectedPageId] = useState(pageIdParam || "1");
    const [pages, setPages] = useState(mockPages);
    const [saving, setSaving] = useState(false);

    const selectedPage = pages.find(p => p.id === selectedPageId) || pages[0];
    const [content, setContent] = useState(selectedPage?.content || "");
    const [pageName, setPageName] = useState(selectedPage?.name || "");

    const handlePageSelect = (pageId: string) => {
        setSelectedPageId(pageId);
        const page = pages.find(p => p.id === pageId);
        if (page) {
            setContent(page.content);
            setPageName(page.name);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        // Simulate save
        await new Promise(r => setTimeout(r, 1000));
        setPages(pages.map(p =>
            p.id === selectedPageId ? { ...p, content, name: pageName } : p
        ));
        setSaving(false);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="flex h-screen">
                {/* Sidebar */}
                <aside className="w-64 border-r border-white/10 bg-slate-900/50 p-4">
                    <div className="flex items-center gap-2 mb-6">
                        <Link href={`/projects/${projectId}`}>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <h2 className="font-semibold text-white">Sayfalar</h2>
                    </div>

                    <div className="space-y-1">
                        {pages.map((page) => (
                            <button
                                key={page.id}
                                onClick={() => handlePageSelect(page.id)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedPageId === page.id
                                        ? "bg-purple-600 text-white"
                                        : "text-slate-300 hover:bg-white/10"
                                    }`}
                            >
                                <span>{page.name}</span>
                                <span className="block text-xs text-slate-500">{page.slug}</span>
                            </button>
                        ))}
                    </div>

                    <Button variant="ghost" size="sm" className="w-full mt-4">
                        <Plus className="w-4 h-4" />
                        Yeni Sayfa
                    </Button>
                </aside>

                {/* Editor */}
                <div className="flex-1 flex flex-col">
                    {/* Editor Header */}
                    <header className="flex items-center justify-between p-4 border-b border-white/10">
                        <div className="flex items-center gap-4">
                            <Input
                                value={pageName}
                                onChange={(e) => setPageName(e.target.value)}
                                className="font-semibold text-lg bg-transparent border-none focus:ring-0"
                            />
                            <Badge variant="outline">{selectedPage?.slug}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={`/projects/${projectId}/preview`}>
                                <Button variant="outline" size="sm">
                                    <Eye className="w-4 h-4" />
                                    Önizle
                                </Button>
                            </Link>
                            <Button size="sm" onClick={handleSave} disabled={saving}>
                                <Save className="w-4 h-4" />
                                {saving ? "Kaydediliyor..." : "Kaydet"}
                            </Button>
                        </div>
                    </header>

                    {/* Content Editor */}
                    <div className="flex-1 p-6 overflow-auto">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle className="text-sm">İçerik Editörü (HTML)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="min-h-[500px] font-mono text-sm"
                                    placeholder="HTML içeriğinizi buraya yazın..."
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Footer */}
                    <footer className="flex items-center justify-between p-4 border-t border-white/10 bg-slate-900/50">
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span>Son düzenleme: Şimdi</span>
                            <span>•</span>
                            <span>{content.length} karakter</span>
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                            Sayfayı Sil
                        </Button>
                    </footer>
                </div>

                {/* Live Preview Panel */}
                <aside className="w-96 border-l border-white/10 bg-slate-900/50 p-4 overflow-auto">
                    <h3 className="font-semibold text-white mb-4">Canlı Önizleme</h3>
                    <div className="bg-white rounded-lg p-4 text-slate-900 text-sm">
                        <div dangerouslySetInnerHTML={{ __html: content }} />
                    </div>
                </aside>
            </div>
        </main>
    );
}
