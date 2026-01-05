import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, LayoutDashboard, Smartphone, Zap, Sparkles, Users, Award } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">Q</div>
            <span className="text-xl font-bold tracking-tight">QuizMaster</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Host Login</Button>
            </Link>
            <Link href="/play">
              <Button className="font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm">
                Join Game <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-sm font-medium text-indigo-400 mb-8 mx-auto">
            <Sparkles size={14} className="fill-indigo-500/20" />
            <span>Interactive Learning Platform</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6">
            Engage your audience with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">real-time quizzes</span>
          </h1>

          <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            The simplest way to host live quizzes for classrooms, events, and team building. No app download required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-14 text-lg bg-white text-black hover:bg-slate-200 rounded-xl font-bold border border-slate-200 shadow-xl shadow-indigo-500/10 transition-all hover:-translate-y-1">
                <LayoutDashboard className="mr-2 w-5 h-5 text-indigo-600" /> Host a Quiz
              </Button>
            </Link>
            <Link href="/play" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full h-14 text-lg border-border bg-card hover:bg-accent rounded-xl font-semibold transition-all">
                <Smartphone className="mr-2 w-5 h-5" /> Join as Player
              </Button>
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-20 bg-muted/30 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                icon={Zap}
                title="Real-time Sync"
                desc="Questions appear instantly on every device. Zero lag, maximum engagement."
                color="text-yellow-500"
              />
              <FeatureCard
                icon={Smartphone}
                title="Mobile First"
                desc="Designed for smartphones from day one. No pinch-to-zoom required."
                color="text-blue-500"
              />
              <FeatureCard
                icon={Award}
                title="Live Leaderboard"
                desc="Gamify the experience with instant scoring and animated leaderboards."
                color="text-green-500"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2024 QuizMaster. Built for modern education.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc, color }: any) {
  return (
    <div className="bg-card border border-border p-8 rounded-2xl hover:border-indigo-500/50 transition-colors shadow-sm">
      <div className={`w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center mb-4 shadow-sm ${color}`}>
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  )
}
