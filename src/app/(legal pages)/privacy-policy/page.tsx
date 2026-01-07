// 'use client';

// import { Shield, Lock, Globe, Mail, FileText, CheckCircle } from 'lucide-react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Separator } from '@/components/ui/separator';
// import { Badge } from '@/components/ui/badge';

// export default function PrivacyPolicy() {
//   return (
//     <>
//       <div className="min-h-screen bg-black text-white">
//         {/* Hero Section */}
//         <section className="relative py-24 px-6 overflow-hidden">
//           <div className="absolute inset-0 bg-linear-to-br from-black via-black to-indigo-950 opacity-80" />
//           <div className="relative max-w-4xl mx-auto text-center">
//             <Badge className="mb-4 bg-indigo-600 text-white">Privacy Policy</Badge>
//             <h1 className="text-5xl md:text-6xl font-bold mb-6">
//               Your Privacy Matters
//             </h1>
//             <p className="text-xl text-gray-300 max-w-2xl mx-auto">
//               At AI Staging, we are committed to protecting your personal information and your right to privacy while providing innovative virtual renovation and furnishing tools for modern real estate.
//             </p>
//             <Shield className="w-20 h-20 mx-auto mt-10 text-indigo-600" />
//           </div>
//         </section>

//         <Separator className="bg-gray-800" />

//         {/* Main Content */}
//         <section className="py-16 px-6 max-w-5xl mx-auto">
//           <Card className="bg-gray-950 border-gray-800 text-white mb-12">
//             <CardHeader>
//               <CardTitle className="text-2xl flex items-center gap-3">
//                 <FileText className="w-8 h-8 text-indigo-600" />
//                 Privacy Policy Overview
//               </CardTitle>
//               <CardDescription className="text-gray-400">
//                 Effective Date: January 05, 2026
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-6 text-gray-300 leading-relaxed">
//               <p>
//                 This Privacy Policy describes how AI Staging (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, and discloses your information when you use our mobile application and website (the &quot;Service&quot;) for AI-powered virtual staging, renovation, and furnishing of real estate properties.
//               </p>
//               <p>
//                 By using the Service, you agree to the collection and use of information in accordance with this policy.
//               </p>
//             </CardContent>
//           </Card>

//           {/* Information We Collect */}
//           <Card className="bg-gray-950 border-gray-800 text-white mb-12">
//             <CardHeader>
//               <CardTitle className="text-2xl flex items-center gap-3">
//                 <Globe className="w-8 h-8 text-indigo-600" />
//                 Information We Collect
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-8">
//               <div>
//                 <h3 className="text-xl font-semibold mb-3 text-indigo-400">Personal Information</h3>
//                 <ul className="space-y-3">
//                   <li className="flex items-start gap-3">
//                     <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
//                     <span>Email address, name, and payment information when you create an account or subscribe.</span>
//                   </li>
//                   <li className="flex items-start gap-3">
//                     <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
//                     <span>Device information (e.g., IP address, device ID, operating system).</span>
//                   </li>
//                 </ul>
//               </div>

//               <div>
//                 <h3 className="text-xl font-semibold mb-3 text-indigo-400">Uploaded Content</h3>
//                 <ul className="space-y-3">
//                   <li className="flex items-start gap-3">
//                     <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
//                     <span>Photos and images of properties you upload for virtual staging, renovation, or furnishing. These may contain personal data (e.g., interior details), but we do not extract or store identifiable information from images beyond processing them for the Service.</span>
//                   </li>
//                   <li className="flex items-start gap-3">
//                     <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
//                     <span>Generated outputs (staged/renovated images) are stored temporarily for your access.</span>
//                   </li>
//                 </ul>
//               </div>

//               <div>
//                 <h3 className="text-xl font-semibold mb-3 text-indigo-400">Usage Data</h3>
//                 <p>Automatically collected information about how you interact with the Service, such as features used and analytics for improvement.</p>
//               </div>
//             </CardContent>
//           </Card>

//           {/* How We Use Your Information */}
//           <Card className="bg-gray-950 border-gray-800 text-white mb-12">
//             <CardHeader>
//               <CardTitle className="text-2xl flex items-center gap-3">
//                 <Lock className="w-8 h-8 text-indigo-600" />
//                 How We Use Your Information
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <ul className="space-y-4 text-gray-300">
//                 <li className="flex items-start gap-3">
//                   <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
//                   <span>To provide and maintain the Service, including processing uploaded images for AI virtual staging and renovation.</span>
//                 </li>
//                 <li className="flex items-start gap-3">
//                   <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
//                   <span>To manage your account and process payments.</span>
//                 </li>
//                 <li className="flex items-start gap-3">
//                   <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
//                   <span>To improve our AI models and Service features (images may be used anonymously for training unless you opt out).</span>
//                 </li>
//                 <li className="flex items-start gap-3">
//                   <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
//                   <span>To communicate with you, including support and updates.</span>
//                 </li>
//               </ul>
//             </CardContent>
//           </Card>

//           {/* Data Security & Sharing */}
//           <Card className="bg-gray-950 border-gray-800 text-white mb-12">
//             <CardHeader>
//               <CardTitle className="text-2xl">Data Security & Sharing</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-6 text-gray-300">
//               <p>We implement industry-standard security measures to protect your data. However, no method is 100% secure.</p>
//               <p>We do not sell your personal information. We may share data with trusted service providers (e.g., cloud storage, payment processors) under strict confidentiality.</p>
//               <p>Uploaded images are processed securely and deleted after a reasonable period unless required for your account.</p>
//             </CardContent>
//           </Card>

//           {/* Your Rights */}
//           <Card className="bg-gray-950 border-gray-800 text-white mb-12">
//             <CardHeader>
//               <CardTitle className="text-2xl">Your Rights</CardTitle>
//             </CardHeader>
//             <CardContent className="text-gray-300">
//               <p>You may access, correct, delete your data, or opt out of certain uses by contacting us. We comply with applicable laws, including GDPR and CCPA where relevant.</p>
//             </CardContent>
//           </Card>

//           {/* Contact */}
//           <Card className="bg-gray-950 border-gray-800 text-white">
//             <CardHeader>
//               <CardTitle className="text-2xl flex items-center gap-3">
//                 <Mail className="w-8 h-8 text-indigo-600" />
//                 Contact Us
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="text-gray-300">
//               <p>If you have questions about this Privacy Policy, please contact us at:</p>
//               <p className="mt-4 font-semibold text-indigo-400">privacy@aistaging.app</p>
//             </CardContent>
//           </Card>
//         </section>
//       </div>
//     </>
//   );
// }

"use client";

import { ShieldCheck, Database, Eye, Share2, Cookie, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            AI Staging, Virtual Renovation & Furnishing for modern real estate.
          </p>
        </div>

        {/* Intro */}
        <Card className="rounded-2xl">
          <CardContent className="p-6 text-slate-600 leading-relaxed">
            This Privacy Policy explains how we collect, use, and protect your
            information when you use our AI-powered staging, virtual renovation,
            and furnishing services. By using our platform, you agree to the
            practices described below.
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="space-y-6">
          <PolicySection
            icon={Database}
            title="Information We Collect"
            content="We collect information you provide directly, such as uploaded property images, account details, and communication data. We may also collect technical data like device information and usage analytics to improve our services."
          />

          <PolicySection
            icon={Eye}
            title="How We Use Your Information"
            content="Your information is used to deliver AI staging results, improve model performance, provide customer support, process payments, and communicate important updates related to your projects."
          />

          <PolicySection
            icon={Share2}
            title="Data Sharing"
            content="We do not sell your personal data. Information may be shared only with trusted service providers required to operate the platform, comply with legal obligations, or complete transactions."
          />

          <PolicySection
            icon={ShieldCheck}
            title="Data Security"
            content="We implement industry-standard security measures to protect your data. While no system is completely secure, we continuously monitor and improve our safeguards to prevent unauthorized access."
          />

          <PolicySection
            icon={Cookie}
            title="Cookies & Tracking"
            content="We use cookies and similar technologies to enhance user experience, analyze traffic, and personalize content. You can manage cookie preferences through your browser settings."
          />

          <PolicySection
            icon={Mail}
            title="Contact Us"
            content="If you have questions about this Privacy Policy or how your data is handled, please contact us at support@yourapp.com."
          />
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-slate-400 pt-10">
          Last updated: {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

function PolicySection({
  icon: Icon,
  title,
  content,
}: {
  icon: any;
  title: string;
  content: string;
}) {
  return (
    <Card className="rounded-2xl border-slate-200">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-50">
          <Icon className="h-5 w-5 text-indigo-600" />
        </div>
        <CardTitle className="text-lg text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-slate-600 leading-relaxed">
        {content}
      </CardContent>
    </Card>
  );
}