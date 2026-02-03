import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// Mock data - replace with actual data fetching
const mockProjects = [
    { id: "1", name: "Örnek Site", description: "Test projesi", template: "corporate", industry: "technology", status: "DRAFT", createdAt: new Date() },
];

export default function ProjectsPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold text-white">Projelerim</h1>
                    </div>
                    <Link href="/projects/new">
                        <Button>
                            <Plus className="w-5 h-5" />
                            Yeni Proje
                        </Button>
                    </Link>
                </div>

                {/* Projects Grid */}
                {mockProjects.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-slate-400 text-lg mb-4">Henüz proje yok</p>
                        <Link href="/projects/new">
                            <Button>İlk Projeyi Oluştur</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mockProjects.map((project) => (
                            <Link key={project.id} href={`/projects/${project.id}`}>
                                <Card className="hover:border-purple-500/50 transition-colors cursor-pointer">
                                    <CardHeader>
                                        <CardTitle>{project.name}</CardTitle>
                                        <CardDescription>{project.description || "Açıklama yok"}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-2 flex-wrap">
                                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                                                {project.template}
                                            </span>
                                            <span className="px-2 py-1 bg-slate-500/20 text-slate-300 text-xs rounded-full">
                                                {project.industry}
                                            </span>
                                            <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                                                {project.status}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
