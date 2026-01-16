import { create } from 'zustand';
import { temporal } from 'zundo';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';

// define the history entry type
export type HistoryEntry = {
  id: string;
  nodeType: string;   
  status: 'pending' | 'success' | 'failed';
  timestamp: Date;
  details?: string;   
};

type RFState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void; 
  
  // new history state
  history: HistoryEntry[];
  addToHistory: (entry: HistoryEntry) => void;
  updateHistoryStatus: (id: string, status: 'success' | 'failed', details?: string) => void;
  setHistory: (history: HistoryEntry[]) => void; 
};

// initial state (optional)
const initialNodes: Node[] = [
  { id: '1', type: 'textNode', position: { x: 100, y: 100 }, data: { text: 'Start here...' } },
];

export const useFlowStore = create<RFState>()(
  temporal(
    (set, get) => ({
      nodes: initialNodes,
      edges: [],
      history: [],
      
      // react flow standard handlers
      onNodesChange: (changes: NodeChange[]) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes),
        });
      },
      onEdgesChange: (changes: EdgeChange[]) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
        });
      },
      onConnect: (connection: Connection) => {
        set({
          edges: addEdge(connection, get().edges),
        });
      },

      // manual setters (for loading from db)
      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      // helper to append a new node 
      addNode: (node) => set({ nodes: [...get().nodes, node] }),

      // history actions
      addToHistory: (entry) => set((state) => ({ 
        history: [entry, ...state.history] 
      })),

      updateHistoryStatus: (id, status, details) => set((state) => ({
        history: state.history.map((entry) => 
          entry.id === id ? { ...entry, status, details } : entry
        ),
      })),

      // used during loading
      setHistory: (history) => set({ history }),
    }),
    {
      limit: 100, 
      // only track node/edge changes for undo/redo, not history logs
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges }),
    }
  )
);
