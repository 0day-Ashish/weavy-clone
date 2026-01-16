import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UploadButton } from '@/components/Upload';
import { Video } from 'lucide-react';

export function VideoNode({ id, data }: { id: string; data: { videoUrl?: string } }) {
  const { updateNodeData } = useReactFlow();

  return (
    <Card className="w-[300px] border border-white/10 shadow-lg bg-[#1a1a1a] text-white">
      <CardHeader className="p-3 bg-red-950/30 border-b border-red-500/20 flex flex-row items-center gap-2">
        <Video className="w-4 h-4 text-red-500" />
        <CardTitle className="text-xs font-medium text-red-100">Video Source</CardTitle>
      </CardHeader>

      <CardContent className="p-3">
        {data.videoUrl ? (
          <div className="relative group">
            {/* requirement: video player preview */}
            <video 
              src={data.videoUrl} 
              controls 
              className="w-full h-32 rounded border border-white/10 bg-black" 
            />
            <button 
              className="absolute top-1 right-1 bg-red-600 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
              onClick={() => updateNodeData(id, { videoUrl: undefined })}
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="nodrag">
             {/* reuses your transloadit button */}
            <UploadButton onUploadComplete={(url) => updateNodeData(id, { videoUrl: url })} />
            <p className="text-[10px] text-slate-500 mt-2 text-center">Supports .mp4, .mov, .webm</p>
          </div>
        )}
        
        {/* requirement: output handle for video url */}
        <div className="flex justify-end mt-3 items-center">
          <span className="text-[10px] text-slate-400 mr-2 uppercase tracking-wide">Video URL</span>
          <Handle 
            type="source" 
            position={Position.Right} 
            className="bg-red-500! w-3! h-3! border-2! border-[#1a1a1a]!" 
          />
        </div>
      </CardContent>
    </Card>
  );
}