"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp" | "profile">("phone");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyOtp = async () => {
    setError("");
    setLoading(true);
    try {
      await api.verifyOtp(phone, otp);
      setStep("profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({
        phone: phone || undefined,
        username: username || undefined,
        display_name: displayName,
        password,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`,
      });
      router.push("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-panel px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-light text-primary mb-2">Create account</h1>
          <p className="text-secondary">
            {step === "phone" && "Enter your phone number"}
            {step === "otp" && "Verify your number"}
            {step === "profile" && "Set up your profile"}
          </p>
        </div>

        {step === "phone" && (
          <div className="space-y-4">
            <input
              type="tel"
              placeholder="Phone number (e.g. +15550019999)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-input rounded-lg px-4 py-3 text-primary outline-none border border-signal focus:border-signal-blue"
            />
            <input
              type="text"
              placeholder="Username (optional)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-input rounded-lg px-4 py-3 text-primary outline-none border border-signal focus:border-signal-blue"
            />
            <button
              onClick={() => {
                if (!phone && !username) { setError("Phone or username is required"); return; }
                setError("");
                setStep("otp");
              }}
              className="w-full bg-signal-blue text-white py-3 rounded-full hover:bg-signal-blue-hover"
            >
              Next
            </button>
            <p className="text-xs text-secondary text-center">Mock OTP: 123456</p>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className="w-full bg-input rounded-lg px-4 py-3 text-primary outline-none text-center text-2xl tracking-widest border border-signal"
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length < 6}
              className="w-full bg-signal-blue text-white py-3 rounded-full disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
            <button onClick={() => setStep("phone")} className="w-full text-signal-blue py-2">
              Back
            </button>
          </div>
        )}

        {step === "profile" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <input
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-input rounded-lg px-4 py-3 text-primary outline-none border border-signal"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-input rounded-lg px-4 py-3 text-primary outline-none border border-signal"
              required
              minLength={4}
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-signal-blue text-white py-3 rounded-full disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        )}

        <p className="text-center text-secondary text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-signal-blue hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
