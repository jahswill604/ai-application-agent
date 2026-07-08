import { LoginForm } from "@/components/LoginForm";

export default function Home() {
  return (
    <div className="min-h-screen flex font-sans bg-black">
      {/* Left side - Dark Gradient */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#090A0F] flex-col justify-between p-16 overflow-hidden border-r border-white/[0.03]">
        {/* Glow effect at bottom right */}
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-20 right-20 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.05] flex items-center justify-center font-medium text-white text-[13px]">
            AI
          </div>
          <span className="text-white/80 font-medium text-[15px] tracking-tight">Job Agent</span>
        </div>

        {/* Middle Content */}
        <div className="relative z-10 max-w-[480px] mt-auto mb-auto">
          <h1 className="text-[38px] leading-[1.2] font-semibold text-white tracking-tight mb-5">
            Apply smarter, not harder
          </h1>
          <p className="text-[#888b94] text-[15px] leading-relaxed">
            Track applications, tailor resumes, and let AI handle the repetitive work so you can focus on landing the right role.
          </p>
        </div>

        {/* Bottom Text */}
        <div className="relative z-10 text-[12px] text-white/30 tracking-tight">
          AI-powered job search and application management.
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white h-screen overflow-y-auto py-12">
        <LoginForm />
      </div>
    </div>
  );
}
