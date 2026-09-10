import React from "react";
import { UserCircle, Bookmark, ExternalLink } from "lucide-react";
import Header from "../components/Header";

export default function AccountScreen({ user }) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Header subtitle="Manage your profile and saved scholarships" />
      
      <div className="bg-white p-6 border border-slate-200 rounded-sm mb-8 flex items-center gap-4 shadow-sm">
        <UserCircle className="text-slate-300" size={56} />
        <div>
          <h2 className="text-xl font-medium text-slate-900">{user?.name || "Student"}</h2>
          <p className="text-sm text-slate-500">{user?.email || "No email provided"}</p>
        </div>
      </div>
      
      <div className="mb-4 flex items-center gap-2">
        <Bookmark className="text-slate-700" size={18} />
        <h3 className="font-serif text-xl font-semibold text-slate-900">Saved Scholarships</h3>
      </div>
      
      <div className="border border-slate-200 rounded-sm bg-white p-10 text-center shadow-sm">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
          <Bookmark size={32} />
        </div>
        <p className="text-slate-900 font-medium text-lg mb-1">No saved scholarships yet</p>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          When you match with scholarships, you'll be able to save them here to track your application progress.
        </p>
      </div>
    </div>
  );
}
