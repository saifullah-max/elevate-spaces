import Footer from "@/components/footer";

export default function LegalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
