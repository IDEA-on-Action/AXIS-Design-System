export function SiteFooter() {
  return (
    <footer className="border-t py-8 md:py-12">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-sm text-muted-foreground">
          Built by IDEA on Action. Open source on GitHub.
        </p>
        <p className="text-sm text-muted-foreground">
          Powered by Next.js 15 & Tailwind CSS
        </p>
      </div>
    </footer>
  )
}
