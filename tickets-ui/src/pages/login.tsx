import { useState } from "react";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";
import logoMA from "../assets/MA.jpg";

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
    <div className="min-h-screen bg-gray flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-40 w-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            <img src={logoMA} alt="Autotech logo" className="h-full w-full object-center block" />
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">Ingresa tus datos para acceder</h1>
          <p className="text-sm text-slate-500">
            Crea tickets y sigue su estatus aqui
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6"
        >
          <div className="space-y-4">
            <label className="text-xs uppercase tracking-wide text-slate-400">
              Usuario o correo
            </label>
            <input
              className="w-full rounded-2xl bg-white/60 border border-slate-800 px-4 py-3 text-blue placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
              placeholder="Usuario o correo"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs uppercase tracking-wide text-slate-400">
              Contraseña
            </label>
            <input
              type="password"
              className="w-full rounded-2xl bg-white/60 border border-slate-800 px-4 py-3 text-blue placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between text-sm text-slate-400">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500" />
              Recuerdame
            </label>

          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-blue-700 to-blue-900 px-4 py-3 text-white font-semibold shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
          >
            Login
          </button>

          <div className="flex items-center gap-3">
            <span className="flex-1 border-t border-white/10" />
            <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
              it@m-autotech.com.mx
            </span>
            <span className="flex-1 border-t border-white/10" />
          </div>

        </form>

      </div>
    </div>
  );
}
