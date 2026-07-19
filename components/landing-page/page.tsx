import Link from 'next/link';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function LandingPage() {
  return (
    <div className="bg-background text-foreground font-sans antialiased h-dvh flex flex-col relative overflow-hidden selection:bg-primary selection:text-primary-foreground">

      <nav className="w-full z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl supports-backdrop-filter:bg-background/40">
        <div className="flex justify-between items-center h-16 px-6 md:px-12 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">Obsidian Precision</span>
          </div>
          
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Link href="#">Features</Link>
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Link href="#">Solutions</Link>
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Link href="#">Pricing</Link>
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground hidden md:inline-flex">
              <Link href="#">Login</Link>
            </Button>
            <Button size="sm" className="px-6">
              <Link href="/appv1/dashboard">
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content Area - Non Scrollable */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center relative z-10 px-6 md:px-12 max-w-[1600px] mx-auto w-full gap-12 lg:gap-24 overflow-hidden">
        
        {/* Left Column: Text & CTA */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6 w-full lg:w-1/2 pt-8 lg:pt-0">
          <Badge variant="secondary" className="rounded-full px-4 py-1.5 border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse mr-2"></span>
            Obsidian Precision v2.0 is live
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-[5rem] font-bold leading-[1.1] tracking-tight">
            API Precision <br className="hidden lg:block" /> for the <span className="text-primary">AI Era</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-[600px] font-light">
            The complete suite for simulating, analyzing, and converting API schemas with machine-learning accuracy. Build faster, break less.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
            <Button size="lg" className="h-14 px-8 text-base shadow-[0_0_30px_oklch(var(--primary)/0.3)] hover:shadow-[0_0_40px_oklch(var(--primary)/0.4)] transition-all">
              <Link href="/appv1/dashboard">
                Get Started for Free
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base border-border hover:bg-accent hover:text-accent-foreground">
              <Link href="#features">
                Explore Features
              </Link>
            </Button>
          </div>
        </div>

        {/* Right Column: Visual Mockup */}
        <div className="w-full lg:w-1/2 flex items-center justify-center relative flex-1 min-h-[300px]">
          <div className="relative w-full max-w-[800px] aspect-4/3 lg:aspect-16/10 glass-panel rounded-2xl p-2 md:p-4 shadow-2xl shadow-primary/5 transform lg:perspective-[2000px] lg:rotate-y-[-10deg] lg:rotate-x-[5deg] transition-transform duration-700 hover:rotate-y-0 hover:rotate-x-0">
            <div className="w-full h-8 bg-card border-b border-border flex items-center px-4 gap-2 rounded-t-xl">
              <div className="w-3 h-3 rounded-full bg-destructive"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <div className="mx-auto font-mono text-muted-foreground text-xs">obsidian-studio</div>
            </div>
            <div className="relative w-full h-[calc(100%-2rem)] rounded-b-xl overflow-hidden bg-background">
              <Image 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxXp36_x4yxW2uBUqaH6lud1jDzTnAvqQ7OHYEEHJ6a5SoW6BaLkFs8f-7_i2e9hBuCtFfIPbezaz_s1y_7CK7zA64rbX3AapyJdLKqnq1nGAYRkTXsVUPuFZwBynz92_AtPXGHWY5i7qC5kUPRGf0498dBXC0ogMmGwS4mExS1YnP6sZTpR1p2DasPSNpwTiJKDmZGq4pjelFKfhZ1ikl1M-QEPu7h54EOqUnXdfabNNvTFTOWy1g"
                alt="API Simulation Dashboard"
                fill
                className="object-cover object-top border border-border/50 opacity-90"
                priority
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
