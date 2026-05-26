import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Registration failed");
        return;
      }

      alert("Registration successful");

      navigate("/login");

    } catch (error) {
      console.error(error);
      alert("Server error");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">

      <div className="w-[350px] p-8 rounded-xl bg-black/60 backdrop-blur-lg border border-green-500/20 shadow-lg shadow-green-500/10">

        <h2 className="text-2xl font-bold text-white text-center mb-2">
          Create Account
        </h2>

        <p className="text-gray-400 text-sm text-center mb-6">
          Sign up to get started
        </p>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-4 p-3 rounded-lg bg-black/40 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-3 rounded-lg bg-black/40 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 p-3 rounded-lg bg-black/40 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
        />

        <button
          onClick={handleRegister}
          className="w-full py-3 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-400 transition"
        >
          Register
        </button>

        <p className="text-gray-400 text-sm text-center mt-5">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-green-400 cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>

      </div>
    </div>
  );
}

export default Register;