"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  useReactFlow, 
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { loadWorkflow } from '@/app/actions/load-workflow';
import { saveWorkflow } from '@/app/actions/save-workflow'; 
import { listWorkflows } from '@/app/actions/list-workflows'; 
import { deleteWorkflow } from '@/app/actions/delete-workflow';
import { UserButton, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Save, Menu, Trash2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { downloadJSON, readJSONFile } from '@/lib/file-utils';
import { Upload, Download, FileJson } from 'lucide-react'; 
import { TEMPLATES } from '@/lib/templates';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFlowStore } from '@/store/flowStore'; 
import { TextNode } from '@/components/TextNode';
import { LLMNode } from '@/components/LLMNode';
import { ImageNode } from '@/components/ImageNode';
import { ExtractNode } from '@/components/ExtractNode';
import { VideoNode } from '@/components/VideoNode';
import { CropNode } from '@/components/CropNode';
import { CanvasControls } from '@/components/CanvasControls';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'; 
import { Input } from '@/components/ui/input'; 
import { ScrollArea } from '@/components/ui/scroll-area'; 
import { 
  Type, 
  ImageIcon, 
  BrainCircuit, 
  Video, 
  Crop,
  ScanLine,
  LayoutTemplate,
  Search,
  Clock,
  Briefcase,
  Command,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { Skeleton } from "@/components/ui/skeleton";

// define node types mapping
const nodeTypes = {
  textNode: TextNode,
  llmNode: LLMNode,
  imageNode: ImageNode, 
  extractNode: ExtractNode,
  videoNode: VideoNode,
  cropNode: CropNode,
};

function NavIcon({ 
  icon, 
  active, 
  onClick,
  label
}: { 
  icon: React.ReactNode, 
  active?: boolean, 
  onClick?: () => void,
  label?: string
}) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            onClick={onClick}
            className={cn(
              "p-3 rounded-xl transition-all duration-200 group relative",
              active ? "bg-[#eefc8f] text-black" : "text-slate-400 hover:text-white hover:bg-white/10"
            )}
          >
            {React.cloneElement(icon as React.ReactElement<any>, { className: "w-5 h-5" })}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-black border border-white/10 text-white">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function QuickAccessCard({ 
  icon, 
  label, 
  onClick, 
  onDragStart 
}: { 
  icon: React.ReactNode, 
  label: string, 
  onClick: () => void,
  onDragStart?: (event: React.DragEvent) => void 
}) {
  return (
    <div 
      className="aspect-square flex flex-col items-center justify-center gap-3 bg-[#1a1a1a] border border-white/5 rounded-xl cursor-grab active:cursor-grabbing hover:bg-[#252525] hover:border-[#eefc8f]/50 transition-all group"
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
    >
      <div className="text-slate-400 group-hover:text-[#eefc8f] transition-colors p-3 bg-black/40 rounded-full">
        {React.cloneElement(icon as React.ReactElement<any>, { className: "w-6 h-6" })}
      </div>
      <span className="text-xs font-medium text-slate-300 group-hover:text-white">{label}</span>
    </div>
  );
}

const proOptions = { hideAttribution: true };

// main flow editor component
export default function FlowEditor() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<'pointer' | 'hand'>('pointer'); 
  
  const [pendingImportData, setPendingImportData] = useState<any>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState<'nodes' | 'history' | 'templates' | 'search' | 'file' | null>(null);
  const [isLoading, setIsLoading] = useState(false); 
  
  const [workflowName, setWorkflowName] = useState("My Workflow");
  const [workflowId, setWorkflowId] = useState<string | undefined>(undefined);
  const [savedWorkflows, setSavedWorkflows] = useState<any[]>([]);

  const refreshWorkflows = async () => {
    const result = await listWorkflows();
    if (result.success) {
      setSavedWorkflows(result.data || []);
    }
  };

  useEffect(() => {
    if (activeSidebar === 'file') {
      refreshWorkflows();
    }
  }, [activeSidebar]);

  const handleLoadSaved = async (id: string) => {
    setIsLoading(true);
    // minimum 800ms delay to show the skeleton effect properly
    const [result] = await Promise.all([
       loadWorkflow(id),
       new Promise(resolve => setTimeout(resolve, 800))
    ]);

    if (result.success && result.data && result.data.nodes) {
      // @ts-ignore
      setNodes(result.data.nodes);
      // @ts-ignore
      setEdges(result.data.edges);
      // @ts-ignore
      setHistory(result.data.history || []);
      setWorkflowName(result.data.name || "Untitled");
      setWorkflowId(result.data.id);
      toast.success(`Loaded: ${result.data.name}`);
    }
    setIsLoading(false);
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<{id: string, name: string} | null>(null);

  const handleDeleteWorkflow = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation(); // prevent loading the workflow
    setWorkflowToDelete({ id, name });
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!workflowToDelete) return;
    
    const result = await deleteWorkflow(workflowToDelete.id);
    if (result.success) {
      toast.success("Workflow deleted");
      refreshWorkflows();
      // if the deleted workflow was the currently loaded one, reset ID
      if (workflowId === workflowToDelete.id) {
         setWorkflowId(undefined);
         setWorkflowName("My Workflow");
      }
    } else {
      toast.error("Failed to delete: " + result.error);
    }
    setIsDeleteDialogOpen(false);
    setWorkflowToDelete(null);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // zustand replacement start
  const { 
    nodes, 
    edges, 
    history,
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    addNode,    
    setNodes,   
    setEdges,
    setHistory 
  } = useFlowStore();
  // zustand replacement end

  const { screenToFlowPosition, setViewport } = useReactFlow(); 
  
  const fileInputRef = useRef<HTMLInputElement>(null); // reference for hidden input

  // export handler
  const handleExport = () => {
    const data = {
      name: "My Workflow",
      nodes,
      edges,
      history
    };
    // create a filename
    const filename = `workflow-${new Date().toISOString().split('T')[0]}.json`;
    downloadJSON(data, filename);
  };

  // import handler
  const handleImportClick = () => {
    // trigger the hidden input file
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await readJSONFile(file);
      
      // basic validation: check if it has nodes/edges arrays
      if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
        toast.error("Invalid workflow file: Missing nodes or edges.");
        return;
      }

      setPendingImportData(data);
      setIsImportDialogOpen(true);
    } catch (error) {
      toast.error("Failed to parse file");
    } finally {
      // reset input so you can select the same file again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const confirmImport = () => {
    if (pendingImportData) {
      setNodes(pendingImportData.nodes);
      setEdges(pendingImportData.edges);
      setHistory(pendingImportData.history || []);
      setPendingImportData(null);
      setIsImportDialogOpen(false);
      toast.success("Workflow imported successfully!");
    }
  };

  const loadTemplate = (template: typeof TEMPLATES[0]) => {
    // open template in new tab to preserve current work
    const url = new URL(window.location.href);
    url.searchParams.set('template', template.id);
    window.open(url.toString(), '_blank');
  };

  // unified initialization effect
  useEffect(() => {
    const initializeCanvas = async () => {
      // check for template param first
      const params = new URLSearchParams(window.location.search);
      const templateId = params.get('template');
      
      if (templateId) {
        const template = TEMPLATES.find(t => t.id === templateId);
        if (template) {
          setIsLoading(true);
          // simulate small loading delay for smooth feel
          await new Promise(resolve => setTimeout(resolve, 500));
          
          setNodes(template.nodes);
          setEdges(template.edges);
          setHistory([]);
          setWorkflowName(template.name); // set name from template
          setWorkflowId(undefined); // ensure it's treated as a new workflow
          
          // clear URL param
          window.history.replaceState({}, '', '/');
          toast.success(`Started from template: ${template.name}`);
          setIsLoading(false);
          return; // stop here, do not load from DB
        }
      }

      // if no template, load last saved workflow from DB
      const result = await loadWorkflow();
      if (result.success && result.data && result.data.nodes) {
        // @ts-ignore
        setNodes(result.data.nodes);
        // @ts-ignore
        setEdges(result.data.edges);
        // @ts-ignore
        setHistory(result.data.history || []);
        setWorkflowName(result.data.name || "My Workflow");
        setWorkflowId(result.data.id);
        console.log("Loaded from DB");
      }
    };

    initializeCanvas();
  }, [setNodes, setEdges, setHistory]); 

  // save handler
  const onSave = async () => {
    const result = await saveWorkflow(workflowName, nodes, edges, history, workflowId);
    if (result && result.success) {
      if (result.id) setWorkflowId(result.id);
      refreshWorkflows();
      toast.success("Workflow Saved Successfully!", {
        style: {
          background: '#10B981', 
          color: 'white',
          border: 'none'
        }
      });
    } else {
      toast.error("Error saving: " + (result?.error || "Unknown error"));
    }
  };

  // drag & drop handlers
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/reactflow/label');
      
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        position,
        data: { label: label || `${type} node` },
      };

      addNode(newNode); 
    },
    [screenToFlowPosition, addNode],
  );

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleSidebarClick = (type: string, label: string) => {
    const newNode = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 }, 
      data: { label },
    };
    addNode(newNode);
  };

  const QuickAccessGrid = () => (
    <div className="grid grid-cols-2 gap-3 p-1">
      <QuickAccessCard 
        icon={<Type />} 
        label="Prompt" 
        onClick={() => handleSidebarClick('textNode', 'New Text')} 
        onDragStart={(event) => onDragStart(event, 'textNode', 'New Text')}
      />
      <QuickAccessCard 
        icon={<ImageIcon />} 
        label="Image" 
        onClick={() => handleSidebarClick('imageNode', 'Upload Image')} 
        onDragStart={(event) => onDragStart(event, 'imageNode', 'Upload Image')}
      />
      <QuickAccessCard 
        icon={<Video />} 
        label="Video" 
        onClick={() => handleSidebarClick('videoNode', 'Upload Video')} 
        onDragStart={(event) => onDragStart(event, 'videoNode', 'Upload Video')}
      />
      <QuickAccessCard 
        icon={<BrainCircuit />} 
        label="LLM" 
        onClick={() => handleSidebarClick('llmNode', 'Gemini Processor')} 
        onDragStart={(event) => onDragStart(event, 'llmNode', 'Gemini Processor')}
      />
      <QuickAccessCard 
        icon={<Crop />} 
        label="Crop" 
        onClick={() => handleSidebarClick('cropNode', 'Crop Image')} 
        onDragStart={(event) => onDragStart(event, 'cropNode', 'Crop Image')}
      />
      <QuickAccessCard 
        icon={<ScanLine />} 
        label="Extract" 
        onClick={() => handleSidebarClick('extractNode', 'Extract Frame')} 
        onDragStart={(event) => onDragStart(event, 'extractNode', 'Extract Frame')}
      />
    </div>
  );

  const WorkflowSkeleton = () => (
    <div className="absolute inset-0 z-50 bg-[#000000] flex items-center justify-center animate-in fade-in duration-300">
      <div className="relative w-full h-full max-w-4xl max-h-[600px] p-10">
        {/* mock nodes */}
        <Skeleton className="absolute top-20 left-20 w-48 h-32 bg-white/5 border border-white/10 rounded-xl" />
        <Skeleton className="absolute top-40 left-1/3 w-64 h-48 bg-white/5 border border-white/10 rounded-xl" />
        <Skeleton className="absolute bottom-20 right-20 w-56 h-40 bg-white/5 border border-white/10 rounded-xl" />
        
        {/* mock connections (static SVG lines) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
           <path d="M 200 150 C 300 150, 300 300, 450 300" stroke="white" strokeWidth="2" fill="none" strokeDasharray="5,5" />
           <path d="M 600 300 C 700 300, 700 500, 800 500" stroke="white" strokeWidth="2" fill="none" strokeDasharray="5,5" />
        </svg>
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
           <div className="flex gap-1">
               <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
               <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
               <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
           </div>
           <span className="text-xs text-slate-500 font-mono animate-pulse">Loading Workflow...</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden flex-col">
      <Toaster position="top-right" /> {/* add toaster here */}
      
      {/* template dialog removed - opening in new tab instead */}

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-purple-400">Import Workflow?</DialogTitle>
            <DialogDescription className="text-slate-400">
              This will overwrite your current workspace with the data from the imported file.
              <br/><br/>
              <strong>Any unsaved changes will be lost.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsImportDialogOpen(false)}
              className="bg-transparent border-white/10 text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmImport}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Overwrite & Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-400">Delete Workflow?</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete <strong>{workflowToDelete?.name}</strong>?
              <br/><br/>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-transparent border-white/10 text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white border-none"
            >
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* top bar */}
      <div className="h-14 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-4 z-20 relative text-white">
        <div className="flex items-center gap-4">
          {/* mobile menu button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-[#0a0a0a] border-r border-white/10 text-white w-64 p-4 flex flex-col">
              <div className="mb-4 mt-2">
                <SheetTitle className="text-xl font-bold text-purple-400">Weavy Clone</SheetTitle>
                <p className="text-xs text-slate-500">Workflow Builder</p>
              </div>
              
              <ScrollArea className="flex-1 -mx-4 px-4">
                <div className="space-y-6">
                  {/* Quick Access Section */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Add Nodes</p>
                    <QuickAccessGrid />
                  </div>

                  {/* Menu Options */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Menu</p>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-white/10" onClick={() => setActiveSidebar('history')}>
                      <Clock className="w-4 h-4" /> History
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-white/10" onClick={() => setActiveSidebar('templates')}>
                      <LayoutTemplate className="w-4 h-4" /> Templates
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-white/10" onClick={() => setActiveSidebar('file')}>
                      <FileJson className="w-4 h-4" /> My Files
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <Input 
              value={workflowName} 
              onChange={(e) => setWorkflowName(e.target.value)} 
              className="h-8 w-32 md:w-64 bg-transparent border-transparent hover:border-white/20 focus:bg-black/50 focus:border-purple-500/50 text-sm md:text-lg font-bold text-white px-2 transition-all focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          
          {/* hidden input for import */}
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept=".json"
            onChange={handleFileChange}
          />

          {/* file menu removed - moved to sidebar */}

          {/* templates dropdown removed - moved to sidebar */}

          {isMounted && (
            <>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="outline" className="bg-black text-white border-white">Sign In</Button>
                </SignInButton>
              </SignedOut>

              <SignedIn>
                <UserButton />
              </SignedIn>
            </>
          )}

          <Button onClick={onSave} className="bg-[#eefc8f] hover:bg-[#dceb6e] text-black gap-2 font-semibold">
            <Save className="w-4 h-4 text-black" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* narrow icon bar */}
        <nav className="hidden md:flex w-16 flex-col items-center py-6 gap-6 bg-[#050505] border-r border-white/10 z-30">
           <div className="mb-2">
             <Command className="w-8 h-8 text-white" />
           </div>
           
           <div className="flex flex-col gap-4 w-full px-2">
             <NavIcon icon={<Search />} label="Search" active={activeSidebar === 'search'} onClick={() => setActiveSidebar(activeSidebar === 'search' ? null : 'search')} />
             <NavIcon icon={<Clock />} label="History" active={activeSidebar === 'history'} onClick={() => setActiveSidebar(activeSidebar === 'history' ? null : 'history')} />
             <NavIcon icon={<Briefcase />} label="Quick Access" active={activeSidebar === 'nodes'} onClick={() => setActiveSidebar(activeSidebar === 'nodes' ? null : 'nodes')} />
             <NavIcon icon={<LayoutTemplate />} label="Templates" active={activeSidebar === 'templates'} onClick={() => setActiveSidebar(activeSidebar === 'templates' ? null : 'templates')} />
             <NavIcon icon={<FileJson />} label="File" active={activeSidebar === 'file'} onClick={() => setActiveSidebar(activeSidebar === 'file' ? null : 'file')} />
           </div>
        </nav>

        {/* expandable panel (left drawer) - Mobile & Desktop */}
        {activeSidebar && (
           <aside className="fixed inset-0 z-50 md:static md:z-20 md:w-80 bg-[#0a0a0a] border-r border-white/10 flex flex-col animate-in slide-in-from-left-5 duration-200 md:absolute md:left-16 md:h-full shadow-2xl">
              <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#0a0a0a]">
                 <h2 className="font-semibold text-white text-lg capitalize tracking-tight">
                   {activeSidebar === 'nodes' ? 'Quick Access' : activeSidebar}
                 </h2>
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:bg-white hover:text-black" onClick={() => setActiveSidebar(null)}>
                   <X className="w-4 h-4" />
                 </Button>
              </div>
              
              <ScrollArea className="flex-1 min-h-0 bg-[#0a0a0a]">
                {activeSidebar === 'nodes' && (
                  <div className="p-4 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                      <Input placeholder="Search nodes..." className="pl-8 bg-black/40 border-white/10 h-9 text-xs text-white placeholder:text-slate-600 focus-visible:ring-purple-500/50" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4">Node Library</p>
                    <QuickAccessGrid />
                  </div>
                )}

                {activeSidebar === 'history' && (
                   <div className="h-full">
                     <RightSidebar />
                   </div>
                )}
                
                {activeSidebar === 'templates' && (
                   <div className="p-4 space-y-4">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4">Start from Scratch</p>
                     <div className="grid grid-cols-2 gap-3 p-1">
                       {TEMPLATES.map((t) => (
                         <QuickAccessCard 
                           key={t.name}
                           icon={<LayoutTemplate />}
                           label={t.name}
                           onClick={() => loadTemplate(t)}
                         />
                       ))}
                     </div>
                   </div>
                )}

                {activeSidebar === 'file' && (
                   <div className="p-4 space-y-4">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4">Manage Workflow</p>
                     <div className="grid grid-cols-2 gap-3 p-1">
                       <QuickAccessCard 
                         icon={<Upload />}
                         label="Import JSON"
                         onClick={handleImportClick}
                       />
                       <QuickAccessCard 
                         icon={<Download />}
                         label="Export JSON"
                         onClick={handleExport}
                       />
                     </div>

                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-8 mb-2">Saved Workflows</p>
                     <div className="flex flex-col gap-2">
                       {savedWorkflows.length === 0 && <p className="text-xs text-slate-600 italic px-1">No saved files yet.</p>}
                       {savedWorkflows.map((wf) => (
                         <div 
                           key={wf.id} 
                           onClick={() => handleLoadSaved(wf.id)}
                           className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-white/5 rounded-lg cursor-pointer hover:bg-white/5 hover:border-white/20 transition-all group relative pr-10"
                         >
                           <div className="p-2 bg-black/40 rounded-full text-slate-400 group-hover:text-purple-400">
                             <FileJson className="w-4 h-4" />
                           </div>
                           <div className="flex flex-col overflow-hidden">
                             <span className="text-sm text-slate-200 font-medium truncate">{wf.name}</span>
                             <span className="text-[10px] text-slate-500">{new Date(wf.updatedAt).toLocaleDateString()}</span>
                           </div>
                           
                           {/* delete button - visible on group hover */}
                           <button  
                             onClick={(e) => handleDeleteWorkflow(e, wf.id, wf.name)}
                             className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-red-400 hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                             title="Delete Workflow"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                       ))}
                     </div>
                   </div>
                )}

                 {activeSidebar === 'search' && (
                   <div className="p-6 text-slate-500 text-sm text-center mt-10">
                     <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                     <p>Global search coming soon.</p>
                   </div>
                )}
              </ScrollArea>
           </aside>
        )}

        {/* main canvas */}
        <div 
          className="flex-1 h-full bg-[#000000] relative"
          ref={reactFlowWrapper}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          {isLoading && <WorkflowSkeleton />}
          
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            style={{ backgroundColor: '#000000' }}
            colorMode="dark"
            proOptions={{ hideAttribution: true }} // hide react flow attribution (global)
            // dynamic props based on tool
            panOnDrag={activeTool === 'hand'}
            panOnScroll={true} // enable two-finger scroll panning
            selectionOnDrag={activeTool === 'pointer'}
            selectionMode={SelectionMode.Partial}
            minZoom={0.1}
          >
            <Background color="#333" gap={16} size={1} />
            {/* replaced standard controls with custom toolbar */}
            <CanvasControls activeTool={activeTool} setActiveTool={setActiveTool} />
            <MiniMap className="hidden md:block bg-black border border-white/20" /> {/* hidden on mobile */}
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
