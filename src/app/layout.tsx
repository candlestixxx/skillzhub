import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SkillzHub",
  description: "C2B Marketplace for AI Training Footage",
};

const version = process.env.NEXT_PUBLIC_APP_VERSION || process.env.npm_package_version || 'v0.0.0'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50`}>
        <main className="flex-1">
          {children}
        </main>
        <footer className="w-full bg-white border-t border-gray-200 py-4 mt-auto">
           <div className="container mx-auto px-4 flex justify-between items-center text-xs text-gray-500">
              <p>&copy; 2026 SkillzHub Inc. All rights reserved.</p>
              <p>Build: {version}</p>
           </div>
        </footer>
      </body>
    </html>
  );
}
