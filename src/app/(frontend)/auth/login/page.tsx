"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { Check } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, setGuest } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.status) {
        setAuth(data.token, data.user);
        toast.success(`Welcome back, ${data.user.name}!`);
        if (data.user.role === "admin" || data.user.role === "chef" || data.user.role === "waiter") {
          router.push("/admin/dashboard");
        } else {
          router.push("/");
        }
      } else {
        toast.error(data.message || "Invalid email or password.");
      }
    } catch (err: any) {
      toast.error("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setGuest({ name: "Guest", email: "guest@foodappi.com", phone: "" });
    toast.success("Continuing as guest.");
    router.push("/");
  };

  const setupCredit = (role: string) => {
    if (role === 'admin') { setEmail('admin@example.com'); setPassword('123456'); }
    else if (role === 'customer') { setEmail('customer@example.com'); setPassword('123456'); }
    else if (role === 'branchManager') { setEmail('branchmanager@example.com'); setPassword('123456'); }
    else if (role === 'posOperator') { setEmail('posoperator@example.com'); setPassword('123456'); }
    else if (role === 'chef') { setEmail('chef@example.com'); setPassword('123456'); }
  };

  return (
    <section className="pt-6 pb-24 sm:pt-8 sm:pb-16 bg-[#f7f7fc] min-h-[calc(100vh-100px)]">
      {/* Login Box */}
      <div className="container mx-auto max-w-[360px] py-6 p-4 mb-6 sm:px-6 shadow-sm rounded-2xl bg-white border border-[#eff0f6]">
        <h2 className="capitalize mb-6 text-center text-[22px] font-semibold leading-[34px] text-[#14142b]">
          Welcome Back
        </h2>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="formEmail" className="block text-sm capitalize mb-1 text-[#14142b]">Email</label>
            <input 
              type="email" 
              id="formEmail"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 rounded-lg border px-4 border-[#D9DBE9] focus:outline-none focus:border-[#ff006b] transition-all"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="formPassword" className="block text-sm capitalize mb-1 text-[#14142b]">Password</label>
            <input 
              type="password"
              id="formPassword"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 rounded-lg border px-4 border-[#D9DBE9] focus:outline-none focus:border-[#ff006b] transition-all" 
            />
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="relative w-3 h-3 flex items-center justify-center border border-[#6E7191] rounded-[3px]">
                <input type="checkbox" id="rememberMe" className="opacity-0 absolute inset-0 cursor-pointer peer" />
                <Check className="w-2.5 h-2.5 text-[#ff006b] opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={4} />
              </div>
              <label htmlFor="rememberMe" className="text-xs text-[#14142b] cursor-pointer select-none">
                Remember Me
              </label>
            </div>
            <Link href="/auth/forgot-password" className="capitalize text-xs font-medium transition text-[#ff006b] hover:underline">
              Forget Password
            </Link>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full h-12 flex items-center justify-center text-center capitalize font-medium rounded-3xl mb-6 text-white bg-[#ff006b] disabled:opacity-70 transition-opacity"
          >
            {loading ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Login"}
          </button>

          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xs text-[#6E7191]">Don't have an account?</span>
            <Link href="/auth/signup" className="text-xs font-medium text-[#ff006b] hover:underline">
              Sign Up
            </Link>
          </div>

          {/* Social login divider */}
          <div className="flex items-center gap-3 mb-4">
            <span className="w-full h-[1px] bg-gradient-to-r from-white to-[#D9DBE9]"></span>
            <span className="text-sm text-[#6E7191]">OR</span>
            <span className="w-full h-[1px] bg-gradient-to-l from-white to-[#D9DBE9]"></span>
          </div>

          {/* Social Login Buttons - Using dummy images for exact UI match */}
          <div className="flex justify-center flex-wrap gap-[10px] mb-6">
             {/* Example structure mirroring the PHP app's social buttons */}
             <div className="flex items-center justify-center gap-1.5 bg-[#F7F7FC] px-3 h-10 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <img className="h-6 w-6 rounded-full p-1" src="/images/default/google.png" alt="Google" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzQyODVGNCIgZD0iTTIyLjU2IDEyLjI1Yy0uMS0xLjEtMS0xLjk5LTEuOTUtMS45OUgxMnY0LjAyaDYuMTdjLS4yNSAxLjM1LTEgMi41Ny0yLjE0IDMuMzRsMy40NiAyLjY4YyIuMDIuMDEtLjAxLjAzLjAxLjAzek0iLz48L3N2Zz4='}} />
                <span className="font-medium text-[13px] text-[#14142b]">Google</span>
             </div>
             <div className="flex items-center justify-center gap-1.5 bg-[#F7F7FC] px-3 h-10 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <img className="h-6 w-6 rounded-full p-1" src="/images/default/facebook.png" alt="Facebook" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzE4NzdGMiIgZD0iTTI0IDEyLjA3Yy0uMDQtNi42My01LjQ1LTExLjk5LTEyLjA3LTExLjk5Uy0uMDMgNS40NC0uMDMgMTIuMDdjMCA1Ljk4IDQuMzggMTAuOTUgMTAuMiAxMS44NXYtOC4zOEg3LjA5di0zLjQ3aDMuMDZWOS4zNGMwLTMuMDMgMS44LTQuNyA0LjU2LTQuNyAxLjMyIDAgMi42OC4yNCAyLjY4LjI0djIuOTRoLTEuNWMtMS40OSAwLTEuOTUuOTMtMS45NSAxLjg3diAyLjI1aDMuMzJsLS41MyAzLjQ3aC0yLjc5djguMzhDMjAuMDQgMjIuOTQgMjQgMTguMDEgMjQgMTIuMDdaIi8+PC9zdmc+'}} />
                <span className="font-medium text-[13px] text-[#14142b]">Facebook</span>
             </div>
          </div>

          <p className="text-sm uppercase text-center mb-3 text-[#6E7191]">OR</p>
          <button 
            type="button"
            onClick={handleGuestLogin}
            className="w-full h-12 leading-[46px] text-center capitalize font-medium rounded-3xl border text-[#ff006b] border-[#ff006b] bg-white hover:bg-[#fff5f9] transition-colors"
          >
            Login As Guest
          </button>
        </form>
      </div>

      {/* Quick Demo Section */}
      <div className="container mx-auto max-w-[360px] py-6 p-4 sm:px-6 shadow-sm rounded-2xl bg-white border border-[#eff0f6]">
        <h2 className="mb-6 text-center text-lg font-medium text-[#14142b]">For Quick Demo</h2>
        <nav className="grid grid-cols-2 gap-3">
          <button onClick={() => setupCredit('admin')} className="w-full h-10 leading-10 rounded-lg text-center text-sm capitalize text-white bg-orange-500 hover:bg-orange-600 transition-colors">Admin</button>
          <button onClick={() => setupCredit('customer')} className="w-full h-10 leading-10 rounded-lg text-center text-sm capitalize text-white bg-emerald-500 hover:bg-emerald-600 transition-colors">Customer</button>
          <button onClick={() => setupCredit('branchManager')} className="w-full h-10 leading-10 rounded-lg text-center text-sm capitalize text-white bg-sky-600 hover:bg-sky-700 transition-colors">Branch Manager</button>
          <button onClick={() => setupCredit('posOperator')} className="w-full h-10 leading-10 rounded-lg text-center text-sm capitalize text-white bg-purple-500 hover:bg-purple-600 transition-colors">Pos Operator</button>
          <button onClick={() => setupCredit('chef')} className="w-full h-10 leading-10 rounded-lg text-center text-sm capitalize text-white bg-blue-500 hover:bg-blue-600 transition-colors col-span-2 sm:col-span-1">Chef (Kitchen)</button>
        </nav>
      </div>
    </section>
  );
}
