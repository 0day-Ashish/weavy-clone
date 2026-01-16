"use client";

import dynamic from 'next/dynamic';
import { ReactFlowProvider } from '@xyflow/react';

// dynamically imported the editor with SSR disabled to prevent hydration mismatch with Radix UI IDs
const FlowEditor = dynamic(() => import('@/components/FlowEditor'), { 
  ssr: false,
  loading: () => <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading Workflow...</div>
});

export default function WorkflowPage() {
  return (
    <ReactFlowProvider>
      <FlowEditor />
    </ReactFlowProvider>
  );
}
