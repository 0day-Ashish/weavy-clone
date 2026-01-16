import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UploadButton } from '@/components/Upload'; 

export function ImageNode({ id, data }: { id: string; data: { imageUrl?: string } }) {
  const { updateNodeData } = useReactFlow();

  return (
    <Card className="w-[250px] border border-white/10 shadow-lg bg-[#1a1a1a] overflow-hidden text-white">
      <CardHeader className="p-2 bg-white/5 border-b border-white/10 flex flex-row items-center">
        <CardTitle className="text-xs font-medium text-white-400 flex items-center gap-2">
          🖼️ Image Source
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-2 flex flex-col gap-2">
        
        {/* if we have an image, show preview. if not, show upload button */}
        {data.imageUrl ? (
          <div className="relative group">
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={data.imageUrl} 
              alt="Uploaded" 
              className="w-full h-32 object-cover rounded border border-white/10" 
            />
            <button 
              className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => updateNodeData(id, { imageUrl: undefined })}
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="nodrag"> {/* class 'nodrag' is important so you can click the button */}
             <UploadButton 
               onUploadComplete={(url) => updateNodeData(id, { imageUrl: url })} 
             />
          </div>
        )}

        {/* output handle - passes the image URL to other nodes */}
        <div className="flex justify-end mt-1">
          <span className="text-[10px] text-slate-400 mr-2">Image URL</span>
          <Handle 
            type="source" 
            position={Position.Right} 
            className="bg-green-500! w-3! h-3! border-2! border-[#1a1a1a]!" 
          />
        </div>

      </CardContent>
    </Card>
  );
}
