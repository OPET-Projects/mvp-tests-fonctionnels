import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import AuthGuard from "@/components/auth/AuthGuard";
import NavBar from "@/components/navbar/NavBar";

export const metadata: Metadata = {
  title: "Troc de vinyles",
  description:
    "Une application de troc de vinyles pour les amateurs de musique. Connectez-vous, partagez vos vinyles et échangez avec d'autres passionnés !",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <AuthGuard>
          <NavBar />
          <main>{children}</main>
        </AuthGuard>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
