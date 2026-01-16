import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Scissors, Crop } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { triggerCrop } from '@/app/actions/run-crop';
import { checkRunStatus } from '@/app/actions/check-status';
import { cn } from '@/lib/utils';
import { useFlowStore } from '@/store/flowStore';

export function CropNode({ id, data }: { id: string; data: any }) {
  const { updateNodeData, getEdges, getNode } = useReactFlow();
  const { addToHistory, updateHistoryStatus } = useFlowStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCrop = async () => {
    // find the connected image node
    const edges = getEdges();
    const targetEdge = edges.find(e => e.target === id && e.targetHandle === 'image_url');

    if (!targetEdge) {
      alert("Please connect an Image Node first!");
      return;
    }

    const sourceNode = getNode(targetEdge.source);
    const imageUrl = sourceNode?.data?.imageUrl as string; // assuming imageNode saves to 'imageUrl'

    if (!imageUrl) {
      alert("The connected node has no image yet.");
      return;
    }

    setIsProcessing(true);

    // history log start
    const historyId = Math.random().toString(36).substr(2, 9);
    addToHistory({
      id: historyId,
      nodeType: 'Smart Crop',
      status: 'pending',
      timestamp: new Date(),
      details: 'Cropping image...'
    });

    // start task
    const result = await triggerCrop(imageUrl, {
      x: data.x || 0,
      y: data.y || 0,
      width: data.width || 50,  
      height: data.height || 50 
    });

    if (!result.success) {
      alert("Failed: " + result.error);
      setIsProcessing(false);
      
      // history log fail
      updateHistoryStatus(historyId, 'failed', `Error: ${result.error}`);
      return;
    }

    // poll for result
    const interval = setInterval(async () => {
      if (!result.runId) {
        clearInterval(interval);
        return;
      }

      const status = await checkRunStatus(result.runId);

      if (status.status === "COMPLETED") {
        clearInterval(interval);
        setIsProcessing(false);
        // save the result to display it
        // @ts-ignore
        updateNodeData(id, { croppedImage: status.output.imageUrl });
        
        // history log success
        updateHistoryStatus(historyId, 'success', 'Image cropped successfully');

      } else if (status.status === "FAILED") {
        clearInterval(interval);
        setIsProcessing(false);
        alert("Crop Failed");

        // history log fail
        updateHistoryStatus(historyId, 'failed', "Task execution failed");
      }
    }, 1000);
  };

  const handleChange = (key: string, val: string) => {
    updateNodeData(id, { [key]: parseInt(val) || 0 });
  };

  return (
    <Card 
      className={cn(
        "w-[300px] border border-white/10 shadow-lg bg-[#1a1a1a] text-white transition-all duration-300",
        isProcessing && "ring-2 ring-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)] animate-pulse"
      )}
    >
      <CardHeader className="p-3 bg-orange-950/30 border-b border-orange-500/20 flex flex-row items-center gap-2">
        <Scissors className="w-4 h-4 text-orange-500" />
        <CardTitle className="text-xs font-medium text-orange-100">Smart Crop</CardTitle>
      </CardHeader>

      <CardContent className="p-3 grid gap-4">
        {/* requirement: image input handle */}
        <div className="relative flex items-center bg-white/5 p-2 rounded border border-dashed border-white/20">
           <Handle 
             type="target" 
             position={Position.Left} 
             id="image_url" 
             className="bg-green-500! w-3! h-3! -left-4! border-2! border-[#1a1a1a]!" 
           />
           <span className="text-xs text-slate-400 ml-2">Image Input</span>
        </div>

        {/* requirement: configurable crop parameters (x, y, width, height) */}
        <div className="grid grid-cols-2 gap-3">
          {['x', 'y', 'width', 'height'].map((param) => (
            <div key={param} className="space-y-1 relative">
              <Label className="text-[10px] text-slate-500 uppercase">{param} (%)</Label>
              <Input 
                type="number" 
                className="h-7 text-xs nodrag bg-white border-white/10 text-black dark:text-black" 
                placeholder={param === 'width' || param === 'height' ? "100" : "0"} 
                onChange={(e) => handleChange(param, e.target.value)} 
              />
              {/* handles allow connecting numbers from other nodes */}
              <Handle 
                type="target" 
                position={Position.Left} 
                id={`${param}_percent`} 
                className="bg-slate-500! w-2! h-2! -left-3! border! border-[#1a1a1a]!" 
                style={{top: '60%'}} 
              />
            </div>
          ))}
        </div>

        {/* run button */}
        <Button 
          size="sm" 
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          onClick={handleCrop}
          disabled={isProcessing}
        >
          {isProcessing ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Scissors className="w-3 h-3 mr-2" />}
          {isProcessing ? "Cropping..." : "Crop Image"}
        </Button>

        {/* result preview */}
        {data.croppedImage && (
          <div className="mt-2 border border-orange-500/50 rounded overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.croppedImage} alt="Result" className="w-full object-cover" />
          </div>
        )}

        {/* output handle */}
        <div className="flex justify-end mt-2 items-center relative">
          <span className="text-[10px] text-slate-400 mr-2 uppercase tracking-wide">Cropped Img</span>
          <Handle 
            type="source" 
            position={Position.Right} 
            className="bg-orange-500! w-3! h-3! -right-4! border-2! border-[#1a1a1a]!" 
          />
        </div>
      </CardContent>
    </Card>
  );
}
