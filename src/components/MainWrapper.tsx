"use client";

import { usePathname } from "next/navigation";

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't add padding on admin pages (admin has its own layout)
  const isAdminPage = pathname?.startsWith('/admin');
  
  return (
    <main className={isAdminPage ? '' : 'pt-24'}>
      {children}
    </main>
  );
}
