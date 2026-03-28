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
    <div className="h-screen flex items-center justify-center bg-gray-100">

      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow w-80"
      >

        <h2 className="text-2xl font-bold mb-6">Login </h2>

        <input
          className="w-full border p-2 mb-4"
          placeholder="Usuario o correo"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />

        <input
          type="password"
          className="w-full border p-2 mb-4"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full bg-blue-600 text-white p-2 rounded font-bold"
        >
          Entrar
        </button>

      </form>
      

      
        
    </div>
  );
}
