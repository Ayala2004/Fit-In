import { Loader2 } from "lucide-react";

export default function LoadingScreen({ message = "טוען נתונים..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-4 animate-in fade-in duration-500">
      <div className="relative">
        <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
        <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full animate-pulse"></div>
      </div>
      <p className="text-slate-500 font-black   animate-bounce">{message}</p>
    </div>
  );
}