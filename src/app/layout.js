import { Press_Start_2P, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: "400",
});

export const metadata = {
  title: "Alex Games",
  description: "Game for everyone.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${pressStart.variable} bg-[#07040f] font-[var(--font-space)] text-[#f5f0ff] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
