import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function TextNode({ id, data }: { id: string; data: { text?: string } }) {
  const { updateNodeData } = useReactFlow();

  return (
    <Card className="min-w-75 border border-white/10 shadow-lg bg-[#1a1a1a] text-white">
      <CardHeader className="p-3 bg-white/5 border-b border-white/10 h-10 flex flex-row items-center space-y-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-200">
          <span className="text-blue-400">📄</span> Text Input
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="grid gap-2">
          <Label className="text-xs text-slate-400">Enter text for the AI:</Label>
          <Textarea 
            className="nodrag text-xs h-25 resize-none font-mono bg-black/40 border-white/10 text-slate-200 focus:border-blue-500/50 placeholder:text-slate-600" 
            value={data.text || ''} 
            onChange={(evt) => updateNodeData(id, { text: evt.target.value })}
            placeholder="Write your prompt here..."
          />
        </div>
        
        <Handle 
          type="source" 
          position={Position.Right} 
          className="w-3! h-3! bg-blue-500! border-2! border-[#1a1a1a]!" 
        />
      </CardContent>
    </Card>
  );
}
