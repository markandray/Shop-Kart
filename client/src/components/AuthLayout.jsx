export default function AuthLayout({ eyebrow, title, subtitle, children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <div className="hidden lg:flex relative flex-col justify-between bg-mossDark text-paper px-14 py-12 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, #E1A73A 0, transparent 45%), radial-gradient(circle at 85% 75%, #B4552E 0, transparent 40%)',
          }}
        />
        <div className="relative">
          <span className="font-display text-2xl">ShopKart</span>
        </div>
        <div className="relative max-w-md">
          <p className="font-display text-[2.75rem] leading-[1.1]">
            {title}
          </p>
          <p className="mt-5 text-[15px] leading-relaxed text-paper/70">
            {subtitle}
          </p>
        </div>
        <div className="relative text-xs text-paper/45">
          &copy; {new Date().getFullYear()} ShopKart. Fresh picks, delivered daily.
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-14 sm:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="font-display text-xl text-moss">ShopKart</span>
          </div>
          <p className="text-sm text-ink/50 mb-1">{eyebrow}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
