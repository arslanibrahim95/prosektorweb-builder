import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "OSGB Site Engine",
    description: "OSGB sitelerini render eden ve publish webhook alan servis",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="tr">
            <body>
                {children}
            </body>
        </html>
    );
}
