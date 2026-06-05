import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Providers } from "@/components/providers";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "SkillBridge",
  description: "SkillBridge learning dashboard"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
