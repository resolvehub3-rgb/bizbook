import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, RefreshCw, AlertTriangle, Code2 } from 'lucide-react';
import { SUPABASE_SCHEMA_SQL } from '../lib/schemaSql';

interface Props {
  onRetry: () => void;
  retrying: boolean;
}

export const MissingTableNotice: React.FC<Props> = ({ onRetry, retrying }) => {
  const [copied, setCopied] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-slate-900 border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-w-3xl mx-auto my-4 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 shrink-0">
          <Database className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>PGRST205 • Schema Setup Required</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Supabase Table <code className="text-amber-300 font-mono">public.businesses</code> Not Found
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Your Supabase project is connected, but the PostgreSQL database tables have not been created yet.
            Run the setup script below in your Supabase SQL editor to create the required tables and Row Level Security policies.
          </p>
        </div>
      </div>

      {/* 2-Step Instructions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs">1</span>
            <span>Copy Database Schema</span>
          </div>
          <p className="text-xs text-slate-400">
            Copies the complete PostgreSQL schema creating <code className="text-slate-300">businesses</code>,{' '}
            <code className="text-slate-300">appointments</code>, <code className="text-slate-300">services</code>, and{' '}
            <code className="text-slate-300">staff</code> tables.
          </p>
          <button
            onClick={handleCopy}
            className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span className="text-emerald-300">SQL Schema Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy SQL Schema (1-Click)</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs">2</span>
            <span>Run in Supabase Dashboard</span>
          </div>
          <p className="text-xs text-slate-400">
            Open your Supabase SQL Editor, paste the script into a new query, and click <strong>"Run"</strong>.
          </p>
          <a
            href="https://supabase.com/dashboard/project/_/sql"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 active:scale-95"
          >
            <ExternalLink className="w-4 h-4 text-indigo-400" />
            <span>Open Supabase SQL Editor</span>
          </a>
        </div>
      </div>

      {/* SQL Preview Toggle & Actions */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
        <button
          type="button"
          onClick={() => setShowSqlPreview(!showSqlPreview)}
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>{showSqlPreview ? 'Hide SQL Code' : 'View SQL Code Preview'}</span>
        </button>

        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
          <span>{retrying ? 'Checking Supabase Schema...' : 'I Have Run the SQL, Recheck Tables'}</span>
        </button>
      </div>

      {showSqlPreview && (
        <div className="mt-4 bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-x-auto max-h-72 text-xs font-mono text-slate-300">
          <pre>{SUPABASE_SCHEMA_SQL}</pre>
        </div>
      )}
    </div>
  );
};
