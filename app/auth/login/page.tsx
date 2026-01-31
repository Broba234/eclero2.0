"use client";
import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const role = searchParams.get("role") || "student";

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                console.error('[LOGIN] Sign in error:', signInError);
                throw signInError;
            }

            if (!data.user) {
                throw new Error('No user returned from sign in');
            }

            // Fetch user role from the database using email via API
            const profileRes = await fetch(`/api/profiles/get?email=${encodeURIComponent(email)}`);
            
            
            if (!profileRes.ok) {
                const errorData = await profileRes.json().catch(() => ({ error: 'Failed to parse error response' }));
                console.error('[LOGIN] Profile lookup failed:', errorData);
                throw new Error(errorData.error || 'Could not determine user role');
            }

            const userData = await profileRes.json();
            
            if (!userData?.role) {
                console.error('[LOGIN] No role found in profile data:', userData);
                throw new Error('Could not determine user role. Please ensure you have registered an account.');
            }

            let homePath = "/home";
            switch (userData.role.toLowerCase()) {
                case "student":
                    homePath = "/home/student";
                    break;
                case "tutor":
                    homePath = "/home/tutor";
                    break;
                case "admin":
                    homePath = "/home/admin";
                    break;
                default:
                    homePath = "/home";
            }

            router.push(homePath);
        } catch (err: any) {
            console.error('[LOGIN] Error:', err?.message || err, err);
            setError(err.message || "An error occurred during login");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen w-full flex flex-col items-center justify-center px-4 bg-gradient-to-b from-[#F8F9FD] to-gray-400">
        <div className="max-w-2xl w-full bg-gradient-to-b from-white via-[#f4f7fb] to-white rounded-[40px] p-6 border-4 border-white shadow-[rgba(133,189,215,0.878)_0px_30px_30px_-20px]">
        <div className="text-center">
  {/* Icon Header */}
  <div className="flex justify-center mb-4">
    <div className="w-16 h-16 rounded-full bg-[#1559C6] flex items-center justify-center shadow-[rgba(133,189,215,0.878)_0px_15px_20px_-10px]">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>
  </div>
  <h2 className="text-3xl font-black text-[#1559C6] mb-1">Sign In</h2>
  <p className="text-gray-600 text-sm mb-4">
   Please enter your email and password to sign in.
  </p>
</div>
  
          <form onSubmit={handleSubmit} className="mt-5">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full focus-border-inline bg-white border-none px-5 py-4 rounded-[20px] mt-4 shadow-[#cff0ff_0px_10px_10px_-5px] placeholder-gray-400 focus:outline-none focus:[border-inline:2px_solid_#12B1D1] transition-all"
            />
            
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full focus-border-inline bg-white border-none px-5 py-4 rounded-[20px] mt-4 shadow-[#cff0ff_0px_10px_10px_-5px] placeholder-gray-400 focus:outline-none focus:[border-inline:2px_solid_#12B1D1] transition-all"
            />
  
            <div className="mt-2 ml-2">
              <Link 
                href="/auth/reset" 
                className="text-[11px] text-[#1559C6] hover:text-[#1559C6] transition"
              >
                Forgot Password ?
              </Link>
            </div>
  
            {error && (
              <div className="mt-4 text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">
                {error}
              </div>
            )}
  
            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold text-white py-4 mt-5 rounded-[20px] bg-[#1559C6] shadow-[rgba(133,189,215,0.878)_0px_20px_10px_-15px] border-none transition-all duration-200 hover:scale-[1.03] hover:shadow-[rgba(133,189,215,0.878)_0px_23px_10px_-20px] active:scale-95 active:shadow-[rgba(133,189,215,0.878)_0px_15px_10px_-10px] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
  
          <div className="mt-6 flex gap-3 items-center justify-start">
          <p className="text-gray-600 text-sm">
    Don't have an account? Sign up as:
  </p>
  
  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
    <Link
      href={`/auth/register?role=student`}
      className="text-[#1559C6] hover:text-[#1559C6] transition text-sm underline"
    >
      Student
    </Link>
    <span className="text-gray-600 text-sm">or</span>
    
    <Link
      href={`/auth/register?role=tutor`}
      className="text-[#1559C6] hover:text-[#1559C6] transition text-sm underline"
    >
      Tutor
    </Link>
  </div>
          </div>
        </div>
      </main>
    );
}

export default function Login() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginContent />
        </Suspense>
    );
}
