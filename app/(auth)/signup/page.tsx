"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-black text-white relative px-4 select-none min-h-screen">
      {/* Background radial lamp */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-white/[0.02] rounded-full blur-[110px] pointer-events-none" />
      
      <div className="relative z-10 glass rounded-lg border border-zinc-900 p-2 shadow-2xl">
        <SignUp
          signInUrl="/login"
          forceRedirectUrl="/dashboard"
          appearance={{
            variables: {
              colorPrimary: "#ffffff",
              colorBackground: "#09090b",
              colorInputBackground: "#18181b",
              colorText: "#f4f4f5",
              colorTextSecondary: "#a1a1aa",
            },
            elements: {
              card: "border-none bg-transparent shadow-none",
              socialButtonsBlockButton: "border border-zinc-800 text-zinc-300 hover:bg-zinc-900",
              formButtonPrimary: "bg-white hover:bg-zinc-200 text-black",
              footerActionLink: "text-zinc-300 hover:text-white font-bold",
            },
          }}
        />
      </div>
    </div>
  );
}
