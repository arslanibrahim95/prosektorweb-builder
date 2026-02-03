"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Monitor, Tablet, Smartphone, RotateCcw, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type DeviceType = "desktop" | "tablet" | "mobile";

const deviceWidths: Record<DeviceType, number> = {
    desktop: 1280,
    tablet: 768,
    mobile: 375,
};

// Mock generated HTML
const mockHTML = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OSGB Hizmetleri</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; line-height: 1.6; color: #333; }
    .hero { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 80px 20px; text-align: center; }
    .hero h1 { font-size: 2.5rem; margin-bottom: 1rem; }
    .hero p { font-size: 1.25rem; opacity: 0.9; max-width: 600px; margin: 0 auto; }
    .hero .cta { display: inline-block; margin-top: 2rem; padding: 12px 32px; background: white; color: #667eea; font-weight: bold; border-radius: 8px; text-decoration: none; }
    .section { padding: 60px 20px; max-width: 1200px; margin: 0 auto; }
    .section h2 { font-size: 2rem; margin-bottom: 2rem; text-align: center; color: #1a1a2e; }
    .services { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
    .service-card { background: #f8f9fa; padding: 24px; border-radius: 12px; text-align: center; }
    .service-card h3 { color: #667eea; margin-bottom: 0.5rem; }
    .footer { background: #1a1a2e; color: white; padding: 40px 20px; text-align: center; }
  </style>
</head>
<body>
  <header class="hero">
    <h1>İş Sağlığı ve Güvenliği Hizmetleri</h1>
    <p>Profesyonel OSGB hizmetleri ile işyerinizin güvenliğini sağlıyoruz.</p>
    <a href="#contact" class="cta">Hemen Teklif Alın</a>
  </header>

  <section class="section">
    <h2>Hizmetlerimiz</h2>
    <div class="services">
      <div class="service-card">
        <h3>İşyeri Hekimliği</h3>
        <p>6331 sayılı kanun kapsamında işyeri hekimliği hizmeti sunuyoruz.</p>
      </div>
      <div class="service-card">
        <h3>İş Güvenliği Uzmanlığı</h3>
        <p>A, B, C sınıfı iş güvenliği uzmanları ile yanınızdayız.</p>
      </div>
      <div class="service-card">
        <h3>Risk Değerlendirmesi</h3>
        <p>Detaylı risk analizi ve değerlendirme raporları hazırlıyoruz.</p>
      </div>
    </div>
  </section>

  <footer class="footer">
    <p>&copy; 2024 OSGB Hizmetleri. Tüm hakları saklıdır.</p>
  </footer>
</body>
</html>
`;

export default function PreviewPage() {
    const params = useParams();
    const projectId = params.id as string;
    const [device, setDevice] = useState<DeviceType>("desktop");
    const [key, setKey] = useState(0);

    const handleRefresh = () => {
        setKey(prev => prev + 1);
    };

    const handleExport = () => {
        // Create blob and download
        const blob = new Blob([mockHTML], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "index.html";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const DeviceButton = ({ type, icon: Icon }: { type: DeviceType; icon: typeof Monitor }) => (
        <Button
            variant={device === type ? "default" : "ghost"}
            size="icon"
            onClick={() => setDevice(type)}
        >
            <Icon className="w-5 h-5" />
        </Button>
    );

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/projects/${projectId}`}>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <h1 className="text-lg font-semibold text-white">Önizleme</h1>
                    </div>

                    {/* Device Switcher */}
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                        <DeviceButton type="desktop" icon={Monitor} />
                        <DeviceButton type="tablet" icon={Tablet} />
                        <DeviceButton type="mobile" icon={Smartphone} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={handleRefresh}>
                            <RotateCcw className="w-5 h-5" />
                        </Button>
                        <Button variant="outline" onClick={handleExport}>
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                        <Button>
                            <ExternalLink className="w-4 h-4" />
                            Yayınla
                        </Button>
                    </div>
                </div>
            </header>

            {/* Preview Container */}
            <div className="flex items-center justify-center p-8 min-h-[calc(100vh-64px)]">
                <div
                    className="transition-all duration-300 ease-in-out"
                    style={{
                        width: device === "desktop" ? "100%" : `${deviceWidths[device]}px`,
                        maxWidth: deviceWidths[device],
                    }}
                >
                    <Card className="overflow-hidden shadow-2xl">
                        {/* Browser Chrome */}
                        <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                            </div>
                            <div className="flex-1 mx-4">
                                <div className="bg-slate-700 rounded-full px-4 py-1 text-xs text-slate-400 text-center">
                                    preview.prosektorbuilder.com
                                </div>
                            </div>
                        </div>

                        {/* iframe Preview */}
                        <iframe
                            key={key}
                            srcDoc={mockHTML}
                            className="w-full bg-white"
                            style={{
                                height: device === "mobile" ? "667px" : device === "tablet" ? "800px" : "600px",
                                border: "none",
                            }}
                            title="Site Preview"
                        />
                    </Card>
                </div>
            </div>

            {/* Device Info Bar */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
                <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="capitalize">{device}</span>
                    <span>•</span>
                    <span>{deviceWidths[device]}px</span>
                </div>
            </div>
        </main>
    );
}
