import { useState } from "react";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Login() {

  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e: any) {
    e.preventDefault();

    try {

      const res = await api.post("/auth/login", {
        identifier,
        password,
      });

      const token = res.data.access_token;
      const user = res.data.user;

      localStorage.setItem("token", token);
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      navigate("/");

    } catch (err) {
      alert("Invalid credentials");
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 mx-auto rounded-full bg-indigo-600 text-white shadow-lg">
            <span className="text-2xl font-black tracking-tight">logo</span>
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">Sign in to your account</h1>
          <p className="text-sm text-slate-500">
            Track tickets, answer conversations, and keep operations moving.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6"
        >
          <div className="space-y-4">
            <label className="text-xs uppercase tracking-wide text-slate-400">
              Email address or username
            </label>
            <input
              className="w-full rounded-2xl bg-slate-900/60 border border-slate-800 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
              placeholder="Usuario o correo"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs uppercase tracking-wide text-slate-400">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-2xl bg-slate-900/60 border border-slate-800 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between text-sm text-slate-400">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500" />
              Remember me
            </label>

          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-white font-semibold shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
          >
            Sign in
          </button>

          <div className="flex items-center gap-3">
            <span className="flex-1 border-t border-white/10" />
            <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
              M-autotech
            </span>
            <span className="flex-1 border-t border-white/10" />
          </div>

        </form>

      </div>
    </div>
  );
}
