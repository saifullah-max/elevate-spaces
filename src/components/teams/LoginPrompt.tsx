'use client'
import { Users, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";

export function LoginPrompt() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-indigo-100">
                    <div className="flex justify-center mb-6">
                        <div className="bg-indigo-100 p-4 rounded-full">
                            <Users className="w-12 h-12 text-indigo-600" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center text-slate-800 mb-3">
                        Teams Feature
                    </h2>

                    <p className="text-center text-slate-600 mb-8">
                        Please <span className="font-semibold text-indigo-600">login</span> or{" "}
                        <span className="font-semibold text-indigo-600">sign up</span> to continue creating teams
                    </p>

                    <div className="flex flex-col gap-3">
                        <Link
                            href="/sign-in"
                            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                        >
                            <LogIn className="w-5 h-5" />
                            Login
                        </Link>

                        <Link
                            href="/sign-up"
                            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-indigo-600 font-semibold py-3 px-6 rounded-lg border-2 border-indigo-200 transition-colors duration-200"
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
