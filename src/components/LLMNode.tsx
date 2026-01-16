import { useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BrainCircuit, Loader2, Sparkles } from 'lucide-react';
import { triggerLLMGeneration } from '@/app/actions/run-workflow';
import { checkRunStatus } from '@/app/actions/check-status';
import { cn } from '@/lib/utils';
import { useFlowStore } from '@/store/flowStore'; 
import ReactMarkdown from 'react-markdown'; 

export function LLMNode({ id, data }: { id: string; data: any }) {
  const { updateNodeData, getEdges, getNode } = useReactFlow();
  const { addToHistory, updateHistoryStatus } = useFlowStore(); 
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRun = async () => {
    setIsProcessing(true);
    updateNodeData(id, { isLoading: true, response: undefined });

    // get inputs
    const edges = getEdges();
    
    // find system prompt (optional)
    const systemEdge = edges.find(e => e.target === id && e.targetHandle === 'system_prompt');
    const systemNode = systemEdge ? getNode(systemEdge.source) : null;
    const systemPrompt = systemNode?.data?.text || "";

    // find user message (required)
    const userEdge = edges.find(e => e.target === id && e.targetHandle === 'user_message');
    const userNode = userEdge ? getNode(userEdge.source) : null;
    const userMessage = (userNode?.data?.response as string) || (userNode?.data?.text as string); // From LLM or TextNode
    
    // find images (now supports multiple)
    // find all edges connected to the 'images' handle
    const imageEdges = edges.filter(
      (e) => e.target === id && e.targetHandle === 'images'
    );

    // map through them to find the data in the source nodes
    const imageUrls = imageEdges.map((edge) => {
      const sourceNode = getNode(edge.source);
      // check all possible image fields (standard, cropped, or extracted)
      return (
        sourceNode?.data?.croppedImage ||
        sourceNode?.data?.extractedImageUrl ||
        sourceNode?.data?.imageUrl
      );
    }).filter(Boolean); // remove any null/undefined values

    if (!userMessage && imageUrls.length === 0) {
      alert("⚠️ Please connect at least a Text Node or an Image Node.");
      setIsProcessing(false);
      updateNodeData(id, { isLoading: false });
      return;
    }

    // history log start
    const historyId = Math.random().toString(36).substr(2, 9);
    addToHistory({
      id: historyId,
      nodeType: 'Gemini Processor',
      status: 'pending',
      timestamp: new Date(),
      details: 'Generating content...'
    });

    // trigger workflow
    const result = await triggerLLMGeneration(
      userMessage || "", 
      data.model || 'gemini-2.5-pro',
      systemPrompt as string,
      imageUrls as string[] // sending an array now
    );

    if (!result.success) {
      alert("Error: " + result.error);
      setIsProcessing(false);
      updateNodeData(id, { isLoading: false });
      
      // history log fail
      updateHistoryStatus(historyId, 'failed', `Error: ${result.error}`);
      return;
    }

    // poll for results
    const interval = setInterval(async () => {
      if (!result.runId) {
        clearInterval(interval);
        return;
      }

      const status = await checkRunStatus(result.runId);
      
      if (status.status === "COMPLETED") {
        clearInterval(interval);
        // @ts-ignore
        updateNodeData(id, { isLoading: false, response: status.output.text });
        setIsProcessing(false);
        
        // history log success
        // @ts-ignore
        const wordCount = status.output.text?.split(/\s+/).length || 0;
        updateHistoryStatus(historyId, 'success', `Generated ${wordCount} words`);

      } else if (status.status === "FAILED") {
        clearInterval(interval);
        setIsProcessing(false);
        updateNodeData(id, { isLoading: false });
        alert("Generation Failed");

        // history log fail
        updateHistoryStatus(historyId, 'failed', "Task execution failed");
      }
    }, 1000);
  };

  return (
    <Card 
      className={cn(
        "w-[350px] border border-purple-500/20 shadow-xl bg-[#0f0f0f] text-white transition-all duration-300",
        (isProcessing || data.isLoading) && "ring-2 ring-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] animate-pulse"
      )}
    >
      <CardHeader className="p-3 bg-purple-950/20 border-b border-purple-500/20 flex flex-row items-center gap-2">
        <BrainCircuit className="w-4 h-4 text-purple-400" />
        <CardTitle className="text-xs font-medium text-purple-100 tracking-wide">
          Gemini Processor
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 flex flex-col gap-4 relative">
        
        {/* input handles */}
        
        {/* system prompt */}
        <div className="relative flex items-center justify-end">
          <span className="text-[10px] text-slate-500 mr-2">System Prompt</span>
          <Handle 
            type="target" 
            position={Position.Left} 
            id="system_prompt"
            className="bg-blue-500! w-2! h-2! border-none! -ml-[2px]!" 
          />
        </div>

        {/* user message (main) */}
        <div className="relative flex items-center justify-end">
          <span className="text-[10px] text-purple-300 font-semibold mr-2">User Message </span>
          <Handle 
            type="target" 
            position={Position.Left} 
            id="user_message"
            className="bg-purple-500! w-3! h-3! border-2! border-[#0f0f0f]! -ml-[4px]!" 
          />
        </div>

        {/* image input */}
        <div className="relative flex items-center justify-end">
          <span className="text-[10px] text-orange-400 mr-2">Image Input</span>
          <Handle 
            type="target" 
            position={Position.Left} 
            id="images"
            className="bg-orange-500! w-2! h-2! border-none! -ml-[2px]!" 
          />
        </div>

        {/* controls */}
        <Select 
          onValueChange={(val) => updateNodeData(id, { model: val })} 
          defaultValue={data.model || "gemini-2.5-pro"}
        >
          <SelectTrigger className="h-8 text-xs bg-black/20 border-white/10 text-white">
            <SelectValue placeholder="Select Model" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
            <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Fast)</SelectItem>
            <SelectItem value="gemini-3-pro-preview">Gemini 3 Pro (Smart)</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          size="sm" 
          onClick={handleRun}
          disabled={isProcessing || data.isLoading}
          className="w-full bg-purple-600/80 hover:bg-purple-600 text-white text-xs"
        >
          {isProcessing ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
          Run Prompt
        </Button>

        {/* output display */}
        {(data.response || data.isLoading) && (
          <div className="mt-3 p-3 bg-black/40 rounded border border-white/5 min-h-[80px] max-h-[300px] overflow-y-auto nodrag nopan nowheel cursor-text text-slate-300 text-xs select-text">
            {data.isLoading ? (
              <div className="flex items-center gap-2 text-purple-400 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Generating response...</span>
              </div>
            ) : (
              <ReactMarkdown
                components={{
                  // style headings
                  h1: ({node, ...props}) => <h1 className="text-lg font-bold text-purple-200 mt-2 mb-1" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-base font-bold text-purple-200 mt-2 mb-1" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-sm font-bold text-purple-100 mt-2 mb-1" {...props} />,
                  
                  // style paragraphs
                  p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                  
                  // style lists
                  ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 pl-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 pl-1" {...props} />,
                  li: ({node, ...props}) => <li className="mb-1" {...props} />,
                  
                  // style code blocks
                  code: ({node, ...props}) => (
                    <code className="bg-white/10 rounded px-1 py-0.5 font-mono text-orange-200" {...props} />
                  ),
                  pre: ({node, ...props}) => (
                    <pre className="bg-black/50 p-2 rounded mb-2 overflow-x-auto border border-white/10" {...props} />
                  ),
                  
                  // style blockquotes
                  blockquote: ({node, ...props}) => (
                    <blockquote className="border-l-2 border-purple-500 pl-2 italic text-slate-400 my-2" {...props} />
                  )
                }}
              >
                {data.response}
              </ReactMarkdown>
            )}
          </div>
        )}
        
        {/* output handle */}
        <Handle type="source" position={Position.Right} id="output" className="bg-purple-500!" />
      </CardContent>
    </Card>
  );
}
