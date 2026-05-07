import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Camera, Wand2, Star, CheckCircle, ArrowRight, Users, Zap, Shield, Crown, Image, Layers, TrendingUp, Heart, LogIn, Loader2 } from "lucide-react";
import promptsAreaPreview from "@/assets/prompts-area-preview.png";
import { toast } from "sonner";
import { trackPageView, trackViewContent } from "@/lib/facebookTracking";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const PromptsIN = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    trackPageView('PromptsIN Sales');
    trackViewContent('PromptsIN', 'Sales Page');
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !password) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    setIsRegistering(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/promptsin-auth?action=register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
        body: JSON.stringify({ name, email, password, phone }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Error creating account");
        setIsRegistering(false);
        return;
      }
      sessionStorage.setItem("promptsin_user", JSON.stringify(data.user));
      toast.success(`Welcome, ${data.user.name}!`);
      navigate("/promptsin/dashboard");
    } catch {
      toast.error("Error connecting to server");
    }
    setIsRegistering(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/promptsin-auth?action=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        toast.error(result.error || "Login error");
        return;
      }
      sessionStorage.setItem("promptsin_user", JSON.stringify(result.user));
      toast.success(`Welcome, ${result.user.name}!`);
      navigate("/promptsin/dashboard");
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setIsLogging(false);
    }
  };

  const scrollToForm = () => {
    document.getElementById("signup")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden">
      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" onClick={() => setShowLogin(false)}>
          <div className="bg-[#111118] border border-white/10 rounded-2xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-1">Sign In</h2>
            <p className="text-gray-400 text-sm mb-6">Access your exclusive prompts</p>
            <form onSubmit={handleLogin} className="space-y-3">
              <input type="email" placeholder="Your email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
              <input type="password" placeholder="Your password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
              <button type="submit" disabled={isLogging} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-bold text-lg disabled:opacity-50">{isLogging ? "Signing in..." : "Sign In"}</button>
            </form>
            <button onClick={() => setShowLogin(false)} className="w-full mt-4 text-gray-500 text-sm hover:text-white transition-colors">Close</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#050508]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-lg">AI <span className="text-purple-400">PROMPTS</span></span>
          </div>
          <button onClick={() => setShowLogin(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/50 text-sm font-medium transition-colors">
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 md:py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/10 via-pink-600/5 to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-32 right-1/4 w-60 h-60 bg-pink-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-5 py-2.5 mb-8">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-purple-200 font-medium">+1000 Professional Prompts</span>
          </div>

          <div className="inline-block bg-green-500/20 border border-green-500/40 rounded-full px-6 py-2 mb-4">
            <span className="text-green-400 font-bold text-sm uppercase tracking-wider">🎉 Start for Free</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight">
            Generate <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">Stunning</span> AI Photos
          </h1>

          {/* Video */}
          <div className="max-w-2xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-900/20 aspect-video mb-10">
            <iframe
              src="https://www.youtube.com/embed/UkDS8-sP4bQ"
              title="AI Prompts"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>

          <p className="text-xl md:text-2xl text-gray-300 mb-3 font-medium">
            The largest AI photo prompt library for professional-quality images.
          </p>
          <p className="text-gray-500 mb-10 max-w-xl mx-auto text-lg">
            Male & female. Always updated. Sign up and start generating now.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button onClick={scrollToForm} className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold text-lg flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-purple-600/30">
              GET ACCESS NOW
              <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={() => setShowLogin(true)} className="px-8 py-4 rounded-2xl border border-white/10 hover:border-purple-500/50 font-medium text-gray-300 hover:text-white transition-colors">
              I already have an account
            </button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-6 text-sm text-gray-500 flex-wrap">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>+500 users</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-700 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-pink-400" />
              <span>+1000 prompts</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-700 hidden sm:block" />
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span>Updated daily</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How does it work?</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Simple: copy the prompt, paste it in your favorite AI, and generate professional photos in seconds.</p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Choose a Prompt", desc: "Browse categories and find the perfect prompt for your needs.", icon: Layers },
            { step: "02", title: "Copy & Paste", desc: "Copy the ready-made prompt and paste it in Google Gemini (100% FREE), ChatGPT, Midjourney, or any other AI.", icon: Zap },
            { step: "03", title: "Photo Ready!", desc: "Get a high-quality professional photo ready to use.", icon: Camera },
          ].map((item, i) => (
            <div key={i} className="relative bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.06] rounded-2xl p-8 text-center group hover:border-purple-500/30 transition-all">
              <div className="text-5xl font-black text-purple-500/10 absolute top-4 right-4">{item.step}</div>
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-purple-500/20 transition-colors">
                <item.icon className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="font-bold text-xl mb-3">{item.title}</h3>
              <p className="text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Preview */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">See the platform inside</h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">A modern interface with hundreds of organized prompts ready to copy</p>
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-900/20">
            <img src={promptsAreaPreview} alt="AI Prompts platform preview" className="w-full h-auto" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4 bg-gradient-to-b from-purple-900/5 via-transparent to-transparent">
        <div className="max-w-5xl mx-auto text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Prompt Categories</h2>
          <p className="text-gray-400 text-lg">Organized prompts so you can find exactly what you need</p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "👩", label: "Female", count: "400+" },
            { icon: "👨", label: "Male", count: "400+" },
            { icon: "📸", label: "Pro Profile", count: "100+" },
            { icon: "🏢", label: "Corporate", count: "80+" },
            { icon: "🌅", label: "Scenarios", count: "60+" },
            { icon: "🛍️", label: "E-commerce", count: "50+" },
            { icon: "🎨", label: "Artistic", count: "40+" },
            { icon: "✨", label: "Trending", count: "New!" },
          ].map((cat, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 text-center hover:border-purple-500/30 hover:bg-white/[0.05] transition-all cursor-default">
              <div className="text-3xl mb-2">{cat.icon}</div>
              <h3 className="font-bold mb-1">{cat.label}</h3>
              <span className="text-xs text-purple-400 font-medium">{cat.count} prompts</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Camera, title: "Professional Photos", desc: "Optimized prompts to generate realistic, high-quality photos with any AI." },
            { icon: Wand2, title: "Super Easy to Use", desc: "Copy and paste directly into AI. No configuration, no hassle. Instant results." },
            { icon: Star, title: "Always Updated", desc: "New prompts added frequently. The most complete and up-to-date prompt library." },
            { icon: Shield, title: "Instant Access", desc: "Sign up and instantly access all prompts. No waiting, no approval needed." },
            { icon: Heart, title: "Female & Male", desc: "Hundreds of specific prompts for high-quality female and male photos." },
            { icon: Layers, title: "+1000 Prompts", desc: "The largest library of professional photo prompts gathered in one place." },
          ].map((f, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 hover:border-purple-500/20 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-10">What you'll get</h2>
          <div className="space-y-3 text-left">
            {[
              "Access to +1000 professional prompts organized by category",
              "Prompts for high-quality female photos",
              "Prompts for professional male photos",
              "Profile, corporate and e-commerce photo prompts",
              "Exclusive creative scenarios and backgrounds",
              "Constant updates with new prompts",
              "Easy-to-use area — copy, paste and generate",
              "Support and exclusive community",
              "Full access to all prompts",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] rounded-xl px-5 py-4 hover:border-green-500/20 transition-colors">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-gray-200">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Form */}
      <section id="signup" className="py-24 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-gradient-to-b from-[#111118] to-[#0a0a10] border border-purple-500/20 rounded-3xl p-8 md:p-10 text-center shadow-2xl shadow-purple-900/20">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
              <Zap className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-300 font-medium">Instant Access</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-black mb-3">
              Sign Up <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Now</span>
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 text-center">
                <div className="text-xs text-gray-400 mb-1">Monthly Plan</div>
                <div className="flex items-baseline justify-center gap-0.5">
                  <span className="text-3xl font-black text-white">$19.90</span>
                  <span className="text-gray-400 text-xs">/mo</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-1">30 days access</div>
              </div>
              <div className="bg-gradient-to-b from-purple-500/20 to-pink-500/10 border-2 border-purple-500/40 rounded-2xl p-4 text-center relative">
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">BEST</div>
                <div className="text-xs text-gray-400 mb-1">Annual Plan</div>
                <div className="flex items-baseline justify-center gap-0.5">
                  <span className="text-3xl font-black text-white">$97</span>
                  <span className="text-gray-400 text-xs">/year</span>
                </div>
                <div className="text-[10px] text-green-400 mt-1">365 days • Save more!</div>
              </div>
            </div>

            <p className="text-gray-400 mb-6 text-sm">Create your free account and test the prompts. Unlock full access by choosing your plan.</p>

            <form onSubmit={handleRegister} className="space-y-3 text-left">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Full name</label>
                <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Email</label>
                <input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Password</label>
                <input type="password" placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Phone (optional)</label>
                <input type="tel" placeholder="+1 (555) 123-4567" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors" />
              </div>
              <button type="submit" disabled={isRegistering} className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-purple-600/25 mt-4 disabled:opacity-50">
                {isRegistering ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating account...</> : <>GET ACCESS TO PROMPTS <ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>

            <p className="text-xs text-gray-600 mt-4">By signing up, you agree to our terms of use.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "How does AI Prompts work?", a: "Sign up, access the member area and find hundreds of prompts organized by category. Just copy the prompt and paste it in an AI image generator. Start free with 5 copies and unlock full access with a Monthly ($19.90/mo) or Annual ($97/year) plan." },
              { q: "Do I need to know how to use AI?", a: "No! The prompts are ready to copy and paste. It's super easy and anyone can use it, even without AI experience." },
              { q: "Which AI tools are compatible?", a: "Our prompts work with Google Gemini (100% FREE), ChatGPT (DALL-E), Midjourney, Leonardo AI, Stable Diffusion and other image generation AIs." },
              { q: "Are prompts updated?", a: "Yes! We add new prompts frequently and update existing ones to ensure better and better results." },
              { q: "Are there female and male prompts?", a: "Yes! We have 400+ female and 400+ male prompts, plus categories like corporate, e-commerce, scenarios and more." },
              { q: "What plans are available?", a: "We have two plans: Monthly for $19.90/month (30 days of access) and Annual for $97/year (365 days of access). You start with 5 free copies to test before choosing." },
              { q: "Do I need to pay to use it?", a: "No! You can sign up for free and test 5 prompts. You only pay when you want unlimited access to all 1000+ prompts." },
            ].map((item, i) => (
              <details key={i} className="group bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors">
                  <span className="font-medium text-gray-200">{item.q}</span>
                  <span className="text-purple-400 text-xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-6 pb-4 text-gray-400 text-sm leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 text-center border-t border-white/5">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="font-bold">AI PROMPTS</span>
        </div>
        <p className="text-gray-600 text-sm">© {new Date().getFullYear()} AI Prompts — All rights reserved</p>
      </footer>
    </div>
  );
};

export default PromptsIN;
