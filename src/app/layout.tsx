import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "ProSektor Builder - AI Website Generator",
    description: "AI destekli web sitesi oluşturma platformu",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="tr">
            <body>{children}</body>
        </html>
    );
}
