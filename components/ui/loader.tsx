import { Spinner } from "@/components/ui/spinner";

export default function SimpLxLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="relative flex items-center justify-center">
        <Spinner className="size-32 text-purple-500" />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-light font-geist tracking-widest text-slate-700">SIMPLX</span>
      </div>
    </div>
  );
}