"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Sparkles, CheckCircle, Circle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface GenerationStep {
    id: string;
    name: string;
    status: "pending" | "running" | "completed" | "error";
    progress?: number;
}

const initialSteps: GenerationStep[] = [
    { id: "analysis", name: "Analiz", status: "pending" },
    { id: "research", name: "Araştırma", status: "pending" },
    { id: "design", name: "Tasarım", status: "pending" },
    { id: "content", name: "İçerik Üretimi", status: "pending" },
    { id: "seo", name: "SEO Optimizasyonu", status: "pending" },
    { id: "build", name: "Sayfa Oluşturma", status: "pending" },
];

export default function GeneratePage() {
    const params = useParams();
    const projectId = params.id as string;

    const [companyName, setCompanyName] = useState("");
    const [description, setDescription] = useState("");
    const [services, setServices] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");

    const [isGenerating, setIsGenerating] = useState(false);
    const [steps, setSteps] = useState<GenerationStep[]>(initialSteps);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setCurrentStepIndex(0);

        // Simulate generation process
        for (let i = 0; i < steps.length; i++) {
            setCurrentStepIndex(i);
            setSteps(prev => prev.map((step, idx) => ({
                ...step,
                status: idx < i ? "completed" : idx === i ? "running" : "pending"
            })));

            // Random delay between 1-3 seconds
            await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));

            setSteps(prev => prev.map((step, idx) => ({
                ...step,
                status: idx <= i ? "completed" : "pending"
            })));
        }

        setIsGenerating(false);
    };

    const isFormValid = companyName && description;

    const StepIcon = ({ status }: { status: GenerationStep["status"] }) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="w-5 h-5 text-green-400" />;
            case "running":
                return (
                    <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                );
            case "error":
                return <AlertCircle className="w-5 h-5 text-red-400" />;
            default:
                return <Circle className="w-5 h-5 text-slate-600" />;
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href={`/projects/${projectId}`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-purple-400" />
                            AI İçerik Üretimi
                        </h1>
                        <p className="text-slate-400">Yapay zeka ile otomatik sayfa içeriği oluşturun</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Form */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Firma Bilgileri</CardTitle>
                                <CardDescription>
                                    AI'ın kaliteli içerik üretebilmesi için firma bilgilerinizi girin
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="companyName">Firma Adı *</Label>
                                    <Input
                                        id="companyName"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="Örn: ABC OSGB"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="description">Firma Tanımı *</Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Firmanızı kısaca tanımlayın..."
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="services">Hizmetler</Label>
                                    <Textarea
                                        id="services"
                                        value={services}
                                        onChange={(e) => setServices(e.target.value)}
                                        placeholder="Sunduğunuz hizmetleri listeleyin..."
                                        className="mt-1"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>İletişim Bilgileri</CardTitle>
                                <CardDescription>
                                    Opsiyonel - sayfalarınızda gösterilecek iletişim bilgileri
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="phone">Telefon</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="0212 XXX XX XX"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email">E-posta</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="info@firma.com"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="address">Adres</Label>
                                    <Textarea
                                        id="address"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="Tam adresiniz..."
                                        className="mt-1"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Button
                            size="lg"
                            className="w-full"
                            disabled={!isFormValid || isGenerating}
                            onClick={handleGenerate}
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Üretiliyor...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    İçerik Üret
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Progress Panel */}
                    <div>
                        <Card className="sticky top-8">
                            <CardHeader>
                                <CardTitle>Üretim Süreci</CardTitle>
                                <CardDescription>
                                    {isGenerating
                                        ? "İçerik üretiliyor, lütfen bekleyin..."
                                        : currentStepIndex === -1
                                            ? "Başlamak için forma bilgileri doldurun"
                                            : "Üretim tamamlandı!"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {steps.map((step, index) => (
                                        <div
                                            key={step.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${step.status === "running"
                                                    ? "bg-purple-500/20 border border-purple-500/50"
                                                    : step.status === "completed"
                                                        ? "bg-green-500/10"
                                                        : "bg-white/5"
                                                }`}
                                        >
                                            <StepIcon status={step.status} />
                                            <div className="flex-1">
                                                <p className={`font-medium ${step.status === "completed" ? "text-green-400" :
                                                        step.status === "running" ? "text-purple-300" :
                                                            "text-slate-400"
                                                    }`}>
                                                    {step.name}
                                                </p>
                                            </div>
                                            <span className="text-xs text-slate-500">
                                                {index + 1}/{steps.length}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {currentStepIndex >= steps.length - 1 && !isGenerating && currentStepIndex !== -1 && (
                                    <div className="mt-6 p-4 bg-green-500/20 rounded-lg border border-green-500/50">
                                        <p className="text-green-300 font-medium flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5" />
                                            İçerik başarıyla üretildi!
                                        </p>
                                        <div className="mt-4 flex gap-2">
                                            <Link href={`/projects/${projectId}/editor`}>
                                                <Button size="sm" variant="outline">
                                                    Düzenle
                                                </Button>
                                            </Link>
                                            <Link href={`/projects/${projectId}/preview`}>
                                                <Button size="sm">
                                                    Önizle
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    );
}
