
export function CollegeLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-transparent overflow-hidden">
        <img 
          src="/college-logo.png" 
          alt="St. Francis College Logo" 
          className="h-full w-full object-contain"
        />
      </div>
      <div className="leading-tight">
        <div className="text-base font-semibold tracking-tight text-foreground">St. Francis</div>
        <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Degree College
        </div>
      </div>
    </div>
  );
}
