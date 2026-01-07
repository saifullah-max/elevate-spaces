import { Card, CardContent } from "@/components/ui/card";

export default function LegalWrapper({ title, description, children }: any) {
  return (
    <div className="bg-white min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-600">{description}</p>
        </div>
        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-4 text-slate-600 leading-relaxed">
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
