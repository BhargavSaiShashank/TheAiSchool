"use client";

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function LoginPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-black text-white relative px-4 select-none">
      {/* Background radial lamp */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-white/[0.02] rounded-full blur-[110px] pointer-events-none" />

      <div className="relative z-10 glass rounded-lg border border-zinc-900 p-2 shadow-2xl">
        <SignIn
          signUpUrl="/signup"
          forceRedirectUrl="/dashboard"
          routing="hash"
          appearance={{
            baseTheme: dark,
            elements: {
              card: "border-none bg-transparent shadow-none",
            },
          }}
        />
      </div>
    </div>
  );
}
