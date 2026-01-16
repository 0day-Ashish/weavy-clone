import { useReactFlow, Panel, useViewport } from '@xyflow/react';
import { 
  MousePointer2, 
  Hand, 
  Undo2, 
  Redo2, 
  ChevronDown 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useFlowStore } from '@/store/flowStore';
import { useStore } from 'zustand';

// defined a props interface for clarity
interface CanvasControlsProps {
  activeTool: 'pointer' | 'hand';
  setActiveTool: (tool: 'pointer' | 'hand') => void;
}

export function CanvasControls({ activeTool, setActiveTool }: CanvasControlsProps) {
  const { zoomIn, zoomOut, zoomTo } = useReactFlow();
  
  // connected to zundo temporal store
  // @ts-ignore - temporal property is added by zundo middleware
  const { undo, redo, pastStates, futureStates } = useStore(useFlowStore.temporal, (state) => state);
  
  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  const { zoom } = useViewport();
  const zoomPercentage = Math.round(zoom * 100);

  const handleZoomSelect = (targetZoom: number) => {
    zoomTo(targetZoom / 100, { duration: 500 });
  };

  return (
    <Panel position="bottom-center" className="mb-8 bg-[#1a1a1a] border border-white/10 rounded-lg p-1 flex items-center gap-1 shadow-2xl">
      {/* pointer tool */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setActiveTool('pointer')}
        className={cn(
          "h-8 w-8 hover:bg-white/10 text-slate-400",
          activeTool === 'pointer' && "bg-[#2a2a2a] text-purple-400 hover:bg-[#2a2a2a] hover:text-purple-400"
        )}
      >
        <MousePointer2 className="w-4 h-4" />
      </Button>

      {/* hand tool */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setActiveTool('hand')}
        className={cn(
          "h-8 w-8 hover:bg-white/10 text-slate-400",
          activeTool === 'hand' && "bg-[#2a2a2a] text-purple-400 hover:bg-[#2a2a2a] hover:text-purple-400"
        )}
      >
        <Hand className="w-4 h-4" />
      </Button>

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* undo */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => undo()}
        disabled={!canUndo}
        className="h-8 w-8 hover:bg-white/10 text-slate-400 disabled:opacity-30"
      >
        <Undo2 className="w-4 h-4" />
      </Button>

      {/* redo */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => redo()}
        disabled={!canRedo}
        className="h-8 w-8 hover:bg-white/10 text-slate-400 disabled:opacity-30"
      >
        <Redo2 className="w-4 h-4" />
      </Button>

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* zoom dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 px-2 text-xs text-slate-400 hover:bg-white/10 hover:text-white font-mono gap-1">
            {zoomPercentage}%
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10 text-slate-300 min-w-[80px]">
          <DropdownMenuItem onClick={() => zoomIn()}>Zoom In (+)</DropdownMenuItem>
          <DropdownMenuItem onClick={() => zoomOut()}>Zoom Out (-)</DropdownMenuItem>
          {[25, 50, 75, 100, 150, 200].map(z => (
             <DropdownMenuItem key={z} onClick={() => handleZoomSelect(z)}>{z}%</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </Panel>
  );
}
