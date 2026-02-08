"use client";

import { useState } from "react";

export default function SigninPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      setError("Login failed");
      return;
    }

    const data = await res.json();
    console.log(data);

    alert("Login successful ✅");
  };

  return (
    <form onSubmit={handleSignin}>
      <input placeholder="email" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="password" onChange={e => setPassword(e.target.value)} />
      <button>Sign In</button>
      {error && <p>{error}</p>}
    </form>
  );
}
