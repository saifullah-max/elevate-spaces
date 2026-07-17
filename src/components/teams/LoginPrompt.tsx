'use client'
import { Users, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";

export function LoginPrompt() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-[#FAF7F2]">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-brand-100">
                    <div className="flex justify-center mb-6">
                        <div className="bg-brand-100 p-4 rounded-full">
                            <Users className="w-12 h-12 text-brand-500" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center text-brand-900 mb-3">
                        Teams Feature
                    </h2>

                    <p className="text-center text-cream-800/70 mb-8">
                        Please <span className="font-semibold text-brand-500">login</span> or{" "}
                        <span className="font-semibold text-brand-500">sign up</span> to continue creating teams
                    </p>

                    <div className="flex flex-col gap-3">
                        <Link
                            href="/sign-in"
                            className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                        >
                            <LogIn className="w-5 h-5" />
                            Login
                        </Link>

                        <Link
                            href="/sign-up"
                            className="flex items-center justify-center gap-2 bg-white hover:bg-cream-50 text-brand-500 font-semibold py-3 px-6 rounded-lg border-2 border-brand-100 transition-colors duration-200"
                        >
                            <UserPlus className="w-5 h-5" />
                            Sign Up
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
