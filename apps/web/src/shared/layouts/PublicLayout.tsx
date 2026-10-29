import type { ReactNode } from "react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-base-100 font-sans text-base-content antialiased">
      <Navbar />
      <main className="pt-20">{children}</main>
      <Footer />
    </div>
  );
}
