"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const templates = [
    { id: "corporate", name: "Kurumsal", description: "Profesyonel şirket siteleri için" },
    { id: "portfolio", name: "Portfolyo", description: "Kişisel çalışma vitrini" },
    { id: "ecommerce", name: "E-Ticaret", description: "Online mağaza" },
    { id: "blog", name: "Blog", description: "İçerik odaklı siteler" },
    { id: "landing", name: "Landing Page", description: "Tek sayfa tanıtım" },
];

const industries = [
    "technology", "healthcare", "finance", "education", "retail",
    "restaurant", "real-estate", "legal", "marketing", "other"
];

export default function NewProjectPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [template, setTemplate] = useState("");
    const [industry, setIndustry] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // TODO: Implement actual project creation
        await new Promise((r) => setTimeout(r, 1000));

        router.push("/projects");
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/projects">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Yeni Proje</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Proje Bilgileri</CardTitle>
                            <CardDescription>Projeniz için temel bilgileri girin</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-300 mb-2">Proje Adı</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Örn: Şirket Web Sitesi"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-300 mb-2">Açıklama (Opsiyonel)</label>
                                <Input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Kısa bir açıklama..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Template Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Şablon Seçimi</CardTitle>
                            <CardDescription>Projeniz için bir başlangıç şablonu seçin</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3">
                                {templates.map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setTemplate(t.id)}
                                        className={`p-4 rounded-lg border text-left transition-all ${template === t.id
                                                ? "border-purple-500 bg-purple-500/20"
                                                : "border-white/10 hover:border-white/30"
                                            }`}
                                    >
                                        <p className="font-medium text-white">{t.name}</p>
                                        <p className="text-sm text-slate-400">{t.description}</p>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Industry Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Sektör</CardTitle>
                            <CardDescription>AI içerik üretimi için sektörünüzü seçin</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {industries.map((ind) => (
                                    <button
                                        key={ind}
                                        type="button"
                                        onClick={() => setIndustry(ind)}
                                        className={`px-4 py-2 rounded-full text-sm transition-all ${industry === ind
                                                ? "bg-purple-600 text-white"
                                                : "bg-white/10 text-slate-300 hover:bg-white/20"
                                            }`}
                                    >
                                        {ind}
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={!name || !template || !industry || loading}
                    >
                        {loading ? (
                            "Oluşturuluyor..."
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Projeyi Oluştur
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </main>
    );
}
