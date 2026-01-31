"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, FormEvent, Suspense } from "react";
import Link from "next/link";
import { supabase } from '@/lib/supabaseClient' // correct

function RegisterContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const role = searchParams.get("role") || "student";
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const allowedRoles = ["student", "tutor", "admin"];
    const normalizedRole = allowedRoles.includes(role.toLowerCase()) ? role.toLowerCase() : "student";

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {

            const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password
            });

            if (signUpError) {
                console.error('[REGISTER] Step 1 failed - Supabase signup error:', signUpError);
                throw signUpError;
            }

            if (!data.user?.id) {
                console.error('[REGISTER] Step 1 failed - No user ID returned from Supabase');
                throw new Error('Failed to create user account');
            }

            const { error: metadataError } = await supabase.auth.updateUser({
                data: {
                    name: fullName,
                    role: normalizedRole
                }
            });

            if (metadataError) {
                console.error('[REGISTER] Step 2 failed - Metadata update error:', metadataError);
                throw new Error('Failed to update user profile information');
            }


            const requestData = {
                id: data.user.id,
                email,
                name: fullName,
                role: normalizedRole
            };
            
            const profileRes = await fetch("/api/profiles/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestData),
            });

            if (!profileRes.ok) {
                let errorData;
                let errorText;
                try {
                    errorText = await profileRes.text();
                    errorData = JSON.parse(errorText);
                } catch (parseError) {
                    errorData = { error: 'Unknown error (not JSON response)' };
                    errorText = 'Non-JSON response';
                }
                console.error('[REGISTER] Step 3 failed - Profile creation error:', {
                    status: profileRes.status,
                    statusText: profileRes.statusText,
                    errorData,
                    errorText,
                    headers: Object.fromEntries(profileRes.headers.entries())
                });
                throw new Error(errorData.error || errorData.details || `Failed to create user profile (${profileRes.status})`);
            }

            const profileData = await profileRes.json();

            const { error: loginError } = await supabase.auth.signInWithPassword({ 
                email, 
                password 
            });

            if (loginError) {
                console.error('[REGISTER] Step 4 failed - Login error:', loginError);
                setError("Account created successfully, but failed to log in automatically. Please log in manually.");
                setLoading(false);
                return;
            }
                router.push(`/home`);
        } catch (err: any) {
            console.error('[REGISTER] Registration failed:', err);
            setError(err.message || "An error occurred during registration. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen w-full flex flex-col items-center justify-center px-4 bg-gradient-to-b from-[#F8F9FD] to-gray-400">
        <div className="max-w-2xl w-full bg-gradient-to-b from-white via-[#f4f7fb] to-white rounded-[40px] p-6 border-4 border-white shadow-[rgba(133,189,215,0.878)_0px_30px_30px_-20px]">
          <div className="text-center">
    <div className="flex justify-center mb-4">
      <div className="w-20 h-20 rounded-full bg-[#1559C6] flex items-center justify-center shadow-[rgba(133,189,215,0.878)_0px_20px_25px_-15px]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      </div>
    </div>
            <h2 className="text-3xl font-black text-[#1559C6] mb-1">Register</h2>

            <div className="text-gray-600 text-sm mb-4">
              Registering as {role.charAt(0).toUpperCase() + role.slice(1)}
            </div>
          </div>
      
          <form onSubmit={handleSubmit} className="mt-5">
            <div className="flex gap-3">
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="First Name"
                className="flex-1 bg-white border-none px-5 py-4 rounded-[20px] mt-4 shadow-[#cff0ff_0px_10px_10px_-5px] placeholder-gray-400 focus:outline-none focus:[border-inline:2px_solid_#12B1D1] transition-all"
              />
              <input
                type="text"
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Last Name"
                className="flex-1 bg-white border-none px-5 py-4 rounded-[20px] mt-4 shadow-[#cff0ff_0px_10px_10px_-5px] placeholder-gray-400 focus:outline-none focus:[border-inline:2px_solid_#12B1D1] transition-all"
              />
            </div>
      
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full bg-white border-none px-5 py-4 rounded-[20px] mt-4 shadow-[#cff0ff_0px_10px_10px_-5px] placeholder-gray-400 focus:outline-none focus:[border-inline:2px_solid_#12B1D1] transition-all"
            />
      
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-white border-none px-5 py-4 rounded-[20px] mt-4 shadow-[#cff0ff_0px_10px_10px_-5px] placeholder-gray-400 focus:outline-none focus:[border-inline:2px_solid_#12B1D1] transition-all"
            />
      
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
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <div className="mt-6 flex gap-3 items-center justify-start">
        <p className="text-gray-600 text-sm">
              Already have an account?{" "}
              <Link 
                href={`/auth/login?role=${role}`} 
                className="font-medium text-[#1559C6] hover:text-[#1559C6] transition"
              >
                Log in
              </Link>
            </p>
        </div>
        </div>
 
      </main>
    );
}

export default function Register() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RegisterContent />
        </Suspense>
    );
}
