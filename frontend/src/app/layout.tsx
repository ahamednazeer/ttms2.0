import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TTMS - Transport Tracking Management System",
  description: "Embassy transport tracking, OTP verification, and automated invoicing platform",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" }
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeScript = `
(() => {
  try {
    const stored = localStorage.getItem('ttms_theme_v2');
    const theme = stored === 'light' || stored === 'dark'
      ? stored
      : 'light';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (_) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                background: 'var(--surface-2)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px',
                boxShadow: 'var(--shadow-md)',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

