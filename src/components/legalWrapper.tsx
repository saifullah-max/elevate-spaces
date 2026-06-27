import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/footer";

export default function LegalWrapper({ title, description, children }: any) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            <p className="text-slate-600">{description}</p>
          </div>
          <Card className="rounded-2xl">
            <CardContent className="p-6 text-slate-600 leading-relaxed [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h4]:mt-4 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-slate-900 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mt-1">
              {children}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
