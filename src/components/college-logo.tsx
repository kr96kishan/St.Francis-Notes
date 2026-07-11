import { GraduationCap } from "lucide-react";

export function CollegeLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
        <GraduationCap className="h-6 w-6" />
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
