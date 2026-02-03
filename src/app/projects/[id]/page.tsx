"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    ArrowLeft,
    FileText,
    Sparkles,
    Eye,
    Upload,
    Settings,
    Globe,
    Calendar,
    Folder
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Mock project data - replace with actual fetch
const getProject = (id: string) => ({
    id,
    name: "Örnek OSGB Sitesi",
    description: "İş sağlığı ve güvenliği hizmetleri için kurumsal web sitesi",
    template: "corporate",
    industry: "healthcare",
    status: "DRAFT",
    domain: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pages: [
        { id: "1", name: "Ana Sayfa", slug: "/", status: "generated" },
        { id: "2", name: "Hakkımızda", slug: "/hakkimizda", status: "generated" },
        { id: "3", name: "Hizmetler", slug: "/hizmetler", status: "draft" },
        { id: "4", name: "İletişim", slug: "/iletisim", status: "draft" },
    ],
});

export default function ProjectDetailPage() {
    const params = useParams();
    const projectId = params.id as string;
    const project = getProject(projectId);
    const [activeTab, setActiveTab] = useState("overview");

    const statusBadge = {
        DRAFT: { variant: "warning" as const, label: "Taslak" },
        GENERATING: { variant: "default" as const, label: "Üretiliyor" },
        READY: { variant: "success" as const, label: "Hazır" },
        PUBLISHED: { variant: "success" as const, label: "Yayında" },
    };

    const status = statusBadge[project.status as keyof typeof statusBadge] || statusBadge.DRAFT;

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/projects">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                                <Badge variant={status.variant}>{status.label}</Badge>
                            </div>
                            <p className="text-slate-400 text-sm">{project.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={`/projects/${projectId}/generate`}>
                            <Button variant="outline">
                                <Sparkles className="w-4 h-4" />
                                AI Üret
                            </Button>
                        </Link>
                        <Link href={`/projects/${projectId}/preview`}>
                            <Button variant="outline">
                                <Eye className="w-4 h-4" />
                                Önizle
                            </Button>
                        </Link>
                        <Button>
                            <Upload className="w-4 h-4" />
                            Yayınla
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="overview">
                            <Folder className="w-4 h-4 mr-2" />
                            Genel Bakış
                        </TabsTrigger>
                        <TabsTrigger value="pages">
                            <FileText className="w-4 h-4 mr-2" />
                            Sayfalar
                        </TabsTrigger>
                        <TabsTrigger value="settings">
                            <Settings className="w-4 h-4 mr-2" />
                            Ayarlar
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview">
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Stats Cards */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-purple-400" />
                                        Sayfalar
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold text-white">{project.pages.length}</p>
                                    <p className="text-slate-400 text-sm">
                                        {project.pages.filter(p => p.status === "generated").length} üretildi
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Globe className="w-5 h-5 text-blue-400" />
                                        Domain
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-lg font-medium text-white">
                                        {project.domain || "Atanmadı"}
                                    </p>
                                    <p className="text-slate-400 text-sm">
                                        {project.domain ? "Bağlı" : "Domain ekleyin"}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-green-400" />
                                        Son Güncelleme
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-lg font-medium text-white">
                                        {new Date(project.updatedAt).toLocaleDateString("tr-TR")}
                                    </p>
                                    <p className="text-slate-400 text-sm">
                                        {new Date(project.updatedAt).toLocaleTimeString("tr-TR")}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Quick Actions */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>Hızlı Aksiyonlar</CardTitle>
                                <CardDescription>Projenizi geliştirmek için bir aksiyon seçin</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <Link href={`/projects/${projectId}/generate`}>
                                        <div className="p-4 rounded-lg border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all cursor-pointer">
                                            <Sparkles className="w-8 h-8 text-purple-400 mb-3" />
                                            <h3 className="font-medium text-white">AI İçerik Üret</h3>
                                            <p className="text-sm text-slate-400">Yapay zeka ile sayfa içeriği oluşturun</p>
                                        </div>
                                    </Link>
                                    <Link href={`/projects/${projectId}/editor`}>
                                        <div className="p-4 rounded-lg border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all cursor-pointer">
                                            <FileText className="w-8 h-8 text-blue-400 mb-3" />
                                            <h3 className="font-medium text-white">İçerik Düzenle</h3>
                                            <p className="text-sm text-slate-400">Sayfaları manuel olarak düzenleyin</p>
                                        </div>
                                    </Link>
                                    <Link href={`/projects/${projectId}/preview`}>
                                        <div className="p-4 rounded-lg border border-white/10 hover:border-green-500/50 hover:bg-green-500/10 transition-all cursor-pointer">
                                            <Eye className="w-8 h-8 text-green-400 mb-3" />
                                            <h3 className="font-medium text-white">Önizleme</h3>
                                            <p className="text-sm text-slate-400">Siteyi canlı olarak görüntüleyin</p>
                                        </div>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Pages Tab */}
                    <TabsContent value="pages">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Sayfa Listesi</CardTitle>
                                    <Button size="sm">
                                        <FileText className="w-4 h-4" />
                                        Yeni Sayfa
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {project.pages.map((page) => (
                                        <Link
                                            key={page.id}
                                            href={`/projects/${projectId}/editor?page=${page.id}`}
                                            className="flex items-center justify-between p-4 rounded-lg border border-white/10 hover:border-purple-500/50 hover:bg-white/5 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-5 h-5 text-slate-400" />
                                                <div>
                                                    <p className="font-medium text-white">{page.name}</p>
                                                    <p className="text-sm text-slate-500">{page.slug}</p>
                                                </div>
                                            </div>
                                            <Badge variant={page.status === "generated" ? "success" : "warning"}>
                                                {page.status === "generated" ? "Üretildi" : "Taslak"}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings">
                        <Card>
                            <CardHeader>
                                <CardTitle>Proje Ayarları</CardTitle>
                                <CardDescription>Projenizin genel ayarlarını düzenleyin</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-slate-400">Proje Adı</label>
                                        <p className="text-white font-medium">{project.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-slate-400">Şablon</label>
                                        <p className="text-white font-medium capitalize">{project.template}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-slate-400">Sektör</label>
                                        <p className="text-white font-medium capitalize">{project.industry}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-slate-400">Oluşturma Tarihi</label>
                                        <p className="text-white font-medium">
                                            {new Date(project.createdAt).toLocaleDateString("tr-TR")}
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                    <Button variant="outline" className="text-red-400 border-red-400/50 hover:bg-red-400/10">
                                        Projeyi Sil
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    );
}
