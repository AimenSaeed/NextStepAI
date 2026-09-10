import React, { useState } from "react";
import { LogIn } from "lucide-react";

export default function LoginScreen({ onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && email.trim()) {
      onLogin({ name, email });
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 mt-10">
      <div className="bg-white p-8 border border-slate-200 rounded-sm shadow-sm">
        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mb-6">
          <LogIn size={24} />
        </div>
        <h1 className="font-serif text-2xl font-semibold text-slate-900 mb-2">Welcome back</h1>
        <p className="text-slate-500 text-sm mb-6">Enter your details to continue to NextStep AI.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-700 mb-1">Full name</label>
            <input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ali Khan"
              className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all" 
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">Email address</label>
            <input 
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ali@example.com"
              className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all" 
            />
          </div>
          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-sm transition-colors mt-4">
            Continue to App
          </button>
        </form>
      </div>
    </div>
  );
}
