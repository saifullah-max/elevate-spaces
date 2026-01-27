"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { signIn } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { setAuth } from "@/store/slices/authSlice";
import { saveAuthToStorage } from "@/lib/auth.storage";

export default function SignInPage() {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError(null);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await signIn({
        email: form.email,
        password: form.password,
      });

      dispatch(setAuth({
        user: response.user,
        token: response.token
      }));

      // Always save to localStorage for consistency
      saveAuthToStorage(response.user, response.token);

      if (response.token && response.user) {
        setForm({ email: "", password: "", rememberMe: false });
        // Redirect to home page after success
        router.push('/');
      }
    } catch (err: unknown) {
      const errorMessage =
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message: string }).message
          : "Sign in failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_API}/auth/google`;
  };


  return (
    <div className="flex justify-center items-center min-h-screen bg-linear-to-br from-slate-50 to-white">
      <div className="w-full max-w-md p-8 space-y-8 rounded-2xl bg-white shadow-lg border border-slate-200">
        {/* Header */}
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-indigo-600 p-3 rounded-xl shadow-sm">
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome back
          </h1>
          <p className="text-slate-600 mt-2">
            Sign in to your ElevateSpaces account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <Input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                className="h-11 border-slate-300 focus:border-indigo-600 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  className="h-11 pr-10 border-slate-300 focus:border-indigo-600 focus:ring-indigo-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-600">
              <input
                type="checkbox"
                name="rememberMe"
                checked={form.rememberMe}
                onChange={handleChange}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
              />
              Remember me
            </label>
            <Link
              href="/forgot-password"
              className="text-indigo-600 hover:text-indigo-700 hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        {/* Social Login */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-slate-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="h-11 border-slate-300 hover:bg-slate-50 text-slate-700 hover:border-slate-400"
              aria-label="Sign in with Google"
              onClick={handleGoogleLogin}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66v-2.77h-3.57c-1.04.67-2.3 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.38-.99-.6-2.04-.6-3.09 0-1.05.22-2.1.6-3.09V5.07H2.18C1.43 6.91 1 8.93 1 11s.43 4.09 1.18 5.91l3.66-2.82z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
                />
              </svg>
            </Button>

            <Button
              variant="outline"
              className="h-11 border-slate-300 hover:bg-slate-50 text-slate-700 hover:border-slate-400"
              aria-label="Sign in with Apple"
            >
              <svg className="w-5 h-5" viewBox="0 0 16 16" fill="#000000">
                <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.734.319.067 1.162-.173 1.954-.483.792-.31 1.356-.515 1.693-.515.337 0 .911.205 1.703.515.792.31 1.636.45 1.955.483.318-.067 1.077-.75 1.653-1.734.576-.984 1.022-1.845 1.022-2.796 0-1.518-.623-3.053-1.698-3.422-.374-.126-.92-.215-1.51-.215-.59 0-1.236.089-1.51.215z" />
              </svg>
            </Button>

            <Button
              variant="outline"
              className="h-11 border-slate-300 hover:bg-slate-50 text-slate-700 hover:border-slate-400"
              aria-label="Sign in with Facebook"
            >
              <svg className="w-5 h-5" viewBox="0 0 16 16" fill="#1877F2">
                <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center pt-4">
          <p className="text-slate-600 text-sm">
            Don't have an account?{" "}
            <Link
              href="/sign-up"
              className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
            >
              Sign up
            </Link>
          </p>
          <p className="text-xs text-slate-500 mt-3">
            By signing in, you agree to our Terms and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
