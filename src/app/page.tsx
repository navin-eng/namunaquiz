
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, LayoutDashboard, Smartphone, Zap, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#030014] text-white flex flex-col overflow-hidden selection:bg-indigo-500/30">

      {/* Background Grid & Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl"></div>
      </div>

      <header className="relative z-50 px-8 py-6 flex justify-between items-center bg-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-500/30">Q</div>
          <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">QuizMaster</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5 rounded-full px-6">Admin Login</Button>
          </Link>
          <Link href="/play">
            <Button className="bg-white text-black hover:bg-slate-200 rounded-full px-6 font-semibold shadow-glow transition-all hover:scale-105">
              Join Game <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4">

        {/* Hero Section */}
        <div className="max-w-5xl mx-auto space-y-8 animate-float">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-indigo-300 mb-4 backdrop-blur-md">
            <Sparkles size={14} className="text-yellow-400" />
            <span>The next generation of interactive learning</span>
          </div>

          <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.9]">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500">Learning</span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Reimagined</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            Connect, compete, and learn with real-time interactive quizzes.
            Experience the gamified classroom of the future.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-12">
            <Link href="/login">
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
                <Button size="lg" className="relative h-16 px-10 text-xl bg-black border border-white/10 hover:bg-slate-900 rounded-full gap-3 transition-transform group-hover:scale-[1.02]">
                  <LayoutDashboard className="text-indigo-400" /> Host a Session
                </Button>
              </div>
            </Link>
            <Link href="/play">
              <Button size="lg" variant="ghost" className="h-16 px-10 text-xl text-slate-300 hover:text-white hover:bg-white/5 rounded-full gap-3 border border-white/5 hover:border-white/20 transition-all">
                <Smartphone className="text-pink-400" /> Join Projector
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Grid (for visual weight) */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto opacity-60">
          {[
            { title: 'Real-time Sync', icon: Zap, desc: 'Instant feedback loop' },
            { title: 'Mobile First', icon: Smartphone, desc: 'Play on any device' },
            { title: 'Live Leaderboard', icon: LayoutDashboard, desc: 'Gamified engagement' }
          ].map((f, i) => (
            <div key={i} className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <f.icon className="w-8 h-8 text-indigo-400" />
              <h3 className="text-lg font-bold">{f.title}</h3>
              <p className="text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>

      </main>

      <footer className="py-8 text-center text-slate-600 text-sm">
        <p>© 2024 QuizMaster. Crafted for Education.</p>
      </footer>
    </div>
  )
}
