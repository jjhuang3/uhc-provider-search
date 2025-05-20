import { Geist, Geist_Mono, Inter, Exo } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const exo = Exo({
  subsets: ['latin'],
  variable: '--font-exo',
  display: 'swap',
});

export const metadata = {
  title: "UHC Provider Search",
  description: "Search Providers in UHC's Network",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${exo.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
