import { useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScanLine, Loader2, Play } from 'lucide-react';
import { triggerExtract } from '@/app/actions/run-extract';
import { checkRunStatus } from '@/app/actions/check-status';
import { cn } from '@/lib/utils';
import { useFlowStore } from '@/store/flowStore';

export function ExtractNode({ id, data }: { id: string; data: { timestamp?: string; extractedImageUrl?: string } }) {
  const { updateNodeData, getEdges, getNode } = useReactFlow();
  const { addToHistory, updateHistoryStatus } = useFlowStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExtract = async () => {
    // find connected video
    const edges = getEdges();
    const targetEdge = edges.find(e => e.target === id && e.targetHandle === 'video_url');
    
    if (!targetEdge) {
      alert("Please connect a Video Node first!");
      return;
    }

    const sourceNode = getNode(targetEdge.source);
    const videoUrl = sourceNode?.data?.videoUrl as string;

    if (!videoUrl) {
      alert("The connected node has no video yet.");
      return;
    }

    // start task
    setIsProcessing(true);
    // default to 1 second if timestamp is missing
    const timestamp = data.timestamp || "1"; 
    
    // history log start
    const historyId = Math.random().toString(36).substr(2, 9);
    addToHistory({
      id: historyId,
      nodeType: 'Video Extract',
      status: 'pending',
      timestamp: new Date(),
      details: `Extracting frame at ${timestamp}s`
    });

    const result = await triggerExtract(videoUrl, timestamp);

    if (!result.success) {
      alert("Failed: " + result.error);
      setIsProcessing(false);
      
      // history log fail
      updateHistoryStatus(historyId, 'failed', `Error: ${result.error}`);
      return;
    }

    // poll for result
    const interval = setInterval(async () => {
      // ensure runId is defined
      if (!result.runId) {
        clearInterval(interval);
        return;
      }

      const status = await checkRunStatus(result.runId);
      
      if (status.status === "COMPLETED") {
        clearInterval(interval);
        setIsProcessing(false);
        // @ts-ignore
        updateNodeData(id, { extractedImageUrl: status.output.imageUrl });
        
        // history log success
        updateHistoryStatus(historyId, 'success', 'Frame extracted');

      } else if (status.status === "FAILED") {
        clearInterval(interval);
        setIsProcessing(false);
        alert("Extraction Failed");

        // history log fail
        updateHistoryStatus(historyId, 'failed', "Task execution failed");
      }
    }, 1000);
  };

  return (
    <Card 
      className={cn(
        "w-[280px] border border-white/10 shadow-lg bg-[#1a1a1a] text-white transition-all duration-300",
        isProcessing && "ring-2 ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] animate-pulse"
      )}
    >
      <CardHeader className="p-2 bg-white/5 border-b border-white/10 flex flex-row items-center gap-2">
        <ScanLine className="w-4 h-4 text-indigo-400" />
        <CardTitle className="text-xs font-medium text-indigo-200">
          Extract Frame
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-3 grid gap-4">
        {/* video input handle */}
        <div className="relative flex items-center bg-white/5 p-2 rounded border border-dashed border-white/20">
           <Handle 
             type="target" 
             position={Position.Left} 
             id="video_url" 
             className="bg-red-500! w-3! h-3! -ml-[18px] border-2! border-[#1a1a1a]!" 
           />
           <span className="text-xs text-slate-400 ml-2">Video Input</span>
        </div>

        {/* timestamp input */}
        <div className="space-y-1 relative">
          <Label className="text-[10px] text-slate-500">Timestamp (Seconds)</Label>
          <Input 
            type="text" 
            className="h-7 text-xs nodrag font-mono bg-black/40 border-white/10 text-slate-200 focus:border-indigo-500/50" 
            placeholder="e.g. 5" 
            value={data.timestamp || ''}
            onChange={(e) => updateNodeData(id, { timestamp: e.target.value })} 
          />
          <Handle 
            type="target" 
            position={Position.Left} 
            id="timestamp" 
            className="bg-slate-500! w-2! h-2! -ml-[22px] border! border-[#1a1a1a]!" 
            style={{top: '65%'}} 
          />
        </div>

        {/* action button */}
        <Button 
          size="sm" 
          className="w-full bg-indigo-600/80 hover:bg-indigo-600 text-white"
          onClick={handleExtract}
          disabled={isProcessing}
        >
          {isProcessing ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Play className="w-3 h-3 mr-2" />}
          {isProcessing ? "Extracting..." : "Get Frame"}
        </Button>

        {/* result display */}
        {data.extractedImageUrl && (
          <div className="mt-2 border border-indigo-500/50 rounded overflow-hidden">
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={data.extractedImageUrl} 
              alt="Extracted Frame" 
              className="w-full object-cover" 
            />
          </div>
        )}

        <div className="flex justify-end mt-1 relative">
          <span className="text-[10px] text-slate-400 mr-2 uppercase tracking-wide">Frame Img</span>
          <Handle 
            type="source" 
            position={Position.Right} 
            className="bg-indigo-500! w-3! h-3! border-2! border-[#1a1a1a]!" 
          />
        </div>
      </CardContent>
    </Card>
  );
}
