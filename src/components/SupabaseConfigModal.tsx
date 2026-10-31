import React, { useState } from 'react';
import { Database, Key, Check, Copy, ExternalLink, X, AlertCircle } from 'lucide-react';
import { getStoredSupabaseConfig, saveSupabaseConfig } from '../lib/supabase';
import { SUPABASE_SCHEMA_SQL } from '../lib/schemaSql';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export const SupabaseConfigModal: React.FC<Props> = ({ isOpen, onClose, onConnected }) => {
  const currentConfig = getStoredSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [copiedSql, setCopiedSql] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!url.trim() || !anonKey.trim()) {
      setError('Please provide both the Supabase Project URL and Anon API Key.');
      return;
    }
    if (!url.startsWith('https://')) {
      setError('Supabase URL must start with https://');
      return;
    }
    saveSupabaseConfig(url, anonKey);
    setError(null);
    onConnected();
    onClose();
  };

  const copySqlSchema = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          aria-label="Close configuration modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Supabase Connection Settings</h2>
            <p className="text-sm text-slate-400">Direct PostgreSQL Database, Auth, Realtime & RLS</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Project URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-project-id.supabase.co"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Found in your Supabase Dashboard &gt; Project Settings &gt; API</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Anon Public API Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Your public `anon` key (safe for browser client with RLS).</p>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-200">Database Schema (PostgreSQL)</span>
              <button
                type="button"
                onClick={copySqlSchema}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied SQL!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Schema SQL</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Run <code className="text-indigo-300 bg-slate-900 px-1.5 py-0.5 rounded">supabase-schema.sql</code> in your
              Supabase SQL Editor to create the <code className="text-slate-300">businesses</code>,{' '}
              <code className="text-slate-300">appointments</code>, <code className="text-slate-300">services</code>, and{' '}
              <code className="text-slate-300">staff</code> tables with unique booking slugs and RLS.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center gap-2"
          >
            <Key className="w-4 h-4" />
            Connect Supabase
          </button>
        </div>
      </div>
    </div>
  );
};
