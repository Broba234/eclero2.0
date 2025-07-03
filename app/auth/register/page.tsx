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
            console.log('[REGISTER] Starting registration for:', { email });

            const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

            // Step 1: Sign up the user (without metadata)
            console.log('[REGISTER] Step 1: Creating user account');
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

            console.log('[REGISTER] Step 1 completed - User created:', { userId: data.user.id });

            // Step 2: Update user metadata with name and role
            console.log('[REGISTER] Step 2: Updating user metadata');
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

            console.log('[REGISTER] Step 2 completed - Metadata updated successfully');

            // Step 3: Create Profile in database
            console.log('[REGISTER] Step 3: Creating profile in database');
            const requestData = {
                id: data.user.id,
                email,
                name: fullName,
                role: normalizedRole
            };
            console.log("[REGISTER] Step 3 - Sending profile create request with:", {
                id: data.user.id,
                email,
                name: fullName,
                role: normalizedRole
            });
            
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
                    console.log('[REGISTER] Raw error response:', errorText);
                    errorData = JSON.parse(errorText);
                } catch (parseError) {
                    errorData = { error: 'Unknown error (not JSON response)' };
                    errorText = 'Non-JSON response';
                    console.log('[REGISTER] Failed to parse error response:', parseError);
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
            console.log('[REGISTER] Step 3 completed - Profile created:', profileData);

            // Step 4: Sign in the user
            console.log('[REGISTER] Step 4: Signing in user');
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

            console.log('[REGISTER] Step 4 completed - User signed in successfully');

            // Step 5: Redirect to dashboard
            console.log('[REGISTER] Step 5: Redirecting to dashboard');
            router.push("/dashboard");

        } catch (err: any) {
            console.error('[REGISTER] Registration failed:', err);
            setError(err.message || "An error occurred during registration. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen w-full flex flex-col items-center justify-center px-4" style={{
            background: 'linear-gradient(to bottom, #2b3340, #23272f, #181a1b)'
        }}>
            <div className="max-w-sm w-full bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20" style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}>
                <div className="text-center">
                    <div className="mt-5 space-y-2">
                        <h3 className="text-gray-100 text-2xl font-bold sm:text-3xl">Register as {role.charAt(0).toUpperCase() + role.slice(1)}</h3>
                        <p className="">Already have an account? <Link href={`/auth/login?role=${role}`} className="font-medium text-blue-300 hover:text-purple-300 transition">Log in</Link></p>
                    </div>
                </div>
                <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-5"
                >
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="font-medium text-white">First Name</label>
                            <input
                                type="text"
                                required
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                className="w-full mt-2 px-3 py-2 text-white bg-transparent outline-none border border-white/30 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 shadow-sm rounded-lg placeholder-gray-300"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="font-medium text-white">Last Name</label>
                            <input
                                type="text"
                                required
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                className="w-full mt-2 px-3 py-2 text-white bg-transparent outline-none border border-white/30 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 shadow-sm rounded-lg placeholder-gray-300"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="font-medium text-white">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full mt-2 px-3 py-2 text-white bg-transparent outline-none border border-white/30 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 shadow-sm rounded-lg placeholder-gray-300"
                        />
                    </div>
                    <div>
                        <label className="font-medium text-white">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full mt-2 px-3 py-2 text-white bg-transparent outline-none border border-white/30 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 shadow-sm rounded-lg placeholder-gray-300"
                        />
                    </div>
                    {error && <div className="text-red-400 text-sm">{error}</div>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-2 text-white font-medium bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 active:from-blue-600 active:to-purple-700 rounded-lg duration-150 shadow-lg"
                    >
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>
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
