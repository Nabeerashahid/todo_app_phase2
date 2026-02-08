"use client";

import { useState } from "react";
import { jwtDecode } from "jwt-decode";

type DecodedToken = {
  sub: string;
  email: string;
  exp: number;
};

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState("");

  const login = async () => {
    const res = await fetch("http://127.0.0.1:8000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    // 🔑 REAL TOKEN
    const realToken = data.access_token;

    localStorage.setItem("token", realToken);
    setToken(realToken);

    const decoded = jwtDecode<DecodedToken>(realToken);
    setUserId(decoded.sub);
  };

  const callProtected = async () => {
    const res = await fetch("http://127.0.0.1:8000/protected", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    console.log(data);
  };

  return (
    <div className="p-10">
      <input
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />
      <input
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      <button onClick={login}>Login</button>

      <p>User ID: {userId}</p>

      <button onClick={callProtected}>Call Protected API</button>
    </div>
  );
}
