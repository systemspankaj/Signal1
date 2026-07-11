"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(identifier, password);
      router.push("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-panel px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-signal-blue mb-6">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm0-8h2v6h-2V9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-light text-primary mb-2">Signal</h1>
          <p className="text-secondary">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Phone number or username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full bg-input rounded-lg px-4 py-3 text-primary outline-none border border-signal focus:border-signal-blue transition-colors"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-input rounded-lg px-4 py-3 text-primary outline-none border border-signal focus:border-signal-blue transition-colors"
            required
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-signal-blue text-white py-3 rounded-full font-medium hover:bg-signal-blue-hover transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-secondary text-sm mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-signal-blue hover:underline">
            Register
          </Link>
        </p>

        <div className="mt-8 p-4 bg-sidebar rounded-xl border border-signal">
          <p className="text-xs text-secondary text-center mb-2">Demo accounts</p>
          <div className="space-y-1 text-xs text-secondary text-center">
            <p>alice / password123</p>
            <p>bob / password123</p>
            <p>carol / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
