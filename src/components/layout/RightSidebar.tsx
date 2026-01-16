import { ScrollArea } from "@/components/ui/scroll-area";
import { useFlowStore } from "@/store/flowStore";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { format } from "date-fns"; 

export function RightSidebar() {
  const { history } = useFlowStore();

  return (
    <div className="w-80 h-full border-l border-white/10 bg-[#0a0a0a] flex flex-col">
      <div className="p-4 border-b border-white/10">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#eefc8f]" />
          Run History
        </h2>
        <p className="text-xs text-slate-500 mt-1">Live execution logs</p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {history.length === 0 && (
            <div className="text-center text-slate-600 text-sm mt-10">
              No runs yet. <br /> Trigger a node to see history.
            </div>
          )}

          {history.map((entry) => (
            <div 
              key={entry.id} 
              className="bg-white/5 border border-white/5 rounded-lg p-3 text-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-200">{entry.nodeType}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {format(entry.timestamp, "HH:mm:ss")}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {entry.status === 'pending' && (
                  <>
                    <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                    <span className="text-blue-400 text-xs">Running...</span>
                  </>
                )}
                {entry.status === 'success' && (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    <span className="text-green-400 text-xs">Completed</span>
                  </>
                )}
                {entry.status === 'failed' && (
                  <>
                    <XCircle className="w-3 h-3 text-red-400" />
                    <span className="text-red-400 text-xs">Failed</span>
                  </>
                )}
              </div>

              {entry.details && (
                <p className="mt-2 text-xs text-slate-400 border-t border-white/5 pt-2 truncate">
                  {entry.details}
                </p>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
