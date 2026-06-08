import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { buildApiUrl, setAuthToken } from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(buildApiUrl("/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.detail || "Login failed");
        return;
      }

      setAuthToken(data.access_token);

      toast.success("Login successful");

      setTimeout(() => {
        navigate("/dashboard");
      }, 800);

    } catch (error) {
      console.error(error);
      toast.error("Server error");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#0f172a,_#000)] flex items-center justify-center px-4 overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute w-[500px] h-[500px] bg-green-500/10 blur-3xl rounded-full top-[-100px] left-[-100px]" />

      <div className="absolute w-[400px] h-[400px] bg-emerald-500/10 blur-3xl rounded-full bottom-[-100px] right-[-100px]" />

      {/* LOGIN CARD */}
      <div className="relative z-10 w-full max-w-md">

        <div className="bg-black/40 backdrop-blur-2xl border border-gray-800 rounded-3xl p-8 shadow-2xl">

          {/* LOGO */}
          <div className="text-center mb-8">

            <h1 className="text-4xl font-black tracking-wide bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
              Stockify
            </h1>

            <p className="text-gray-400 mt-3">
              Smart Trading Dashboard
            </p>

          </div>

          {/* TITLE */}
          <div className="mb-8">

            <h2 className="text-3xl font-bold text-white text-center">
              Welcome Back
            </h2>

            <p className="text-gray-500 text-center mt-2">
              Login to continue trading
            </p>

          </div>

          {/* EMAIL */}
          <div className="mb-5">

            <label className="text-sm text-gray-400 mb-2 block">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-2xl bg-black/50 border border-gray-700 text-white placeholder-gray-500 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all"
            />

          </div>

          {/* PASSWORD */}
          <div className="mb-6">

            <label className="text-sm text-gray-400 mb-2 block">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-2xl bg-black/50 border border-gray-700 text-white placeholder-gray-500 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all"
            />

          </div>

          {/* BUTTON */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
              loading
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(34,197,94,0.35)] text-black"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* REGISTER */}
          <p className="text-gray-500 text-center mt-7">

            Don’t have an account?{" "}

            <span
              onClick={() => navigate("/register")}
              className="text-green-400 cursor-pointer hover:text-green-300 transition font-semibold"
            >
              Register
            </span>

          </p>

        </div>

      </div>
    </div>
  );
}

export default Login;
