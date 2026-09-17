import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vision House Eye Hospital | Ranchi",
  description:
    "Vision House Eye Hospital, Ranchi — comprehensive eye care, cataract & advanced surgery led by Dr. R.K Thakur. Clear vision, better life.",
};

export const viewport: Viewport = {
  themeColor: "#0F766E",
  width: "device-width",
  initialScale: 1,
};

// Runs before paint to apply the saved theme and avoid a flash of the wrong theme.
const themeScript = `
(function(){try{
  var t = localStorage.getItem('theme');
  var m = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (t === 'dark' || (!t && m)) document.documentElement.classList.add('dark');
}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans bg-app text-app">{children}</body>
    </html>
  );
}
