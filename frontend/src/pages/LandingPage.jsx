import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-white min-h-screen flex flex-col w-full">
      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="w-full border-b border-slate-100 px-8 py-5 flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight text-slate-900">
          codex<span className="text-emerald-600">CEL</span>
        </span>
      </header>

      {/* ── Hero ─────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-3xl w-full flex flex-col items-center justify-center text-center space-y-10">

          {/* Headline */}
          <h1
            className="text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-tight"
            style={{ fontFamily: "'Geist Variable', sans-serif" }}
          >
            Frictionless Business
            <br />
            Intelligence.
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-slate-500 leading-relaxed max-w-xl mx-auto">
            Upload a spreadsheet, ask a question in plain English, and get
            instant charts and insights — no formulas, no pivot tables.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white rounded-lg shadow-md px-16 w-32 h-12 text-base font-semibold transition-all duration-200"
              onClick={() => navigate('/dashboard')}
            >
              Get started
              <ArrowRight size={18} className="ml-2" strokeWidth={2.5} />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="text-slate-500 hover:text-slate-900 h-14 px-8 text-base"
              asChild
            >
              <a
                href="https://github.com/rumman999/codexCEL"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Code
              </a>
            </Button>
          </div>

          {/* Social proof line */}
          <p className="text-sm text-slate-400 pt-4">
            Built for OpenAI Codex Community Challenge &mdash; no account required.
          </p>
        </div>
      </main>
    </div>
  );
}
