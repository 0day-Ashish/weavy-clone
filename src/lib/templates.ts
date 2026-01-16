import { Node, Edge } from '@xyflow/react';

export type Template = {
  id: string; 
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
};

export const TEMPLATES: Template[] = [
  {
    id: "blank-canvas",
    name: "Blank Canvas",
    description: "Start fresh with an empty workflow.",
    nodes: [],
    edges: []
  },
  {
    id: "simple-chatbot",
    name: "Simple Chatbot",
    description: "A basic text-to-text AI conversation setup.",
    nodes: [
      { id: 't1', type: 'textNode', position: { x: 100, y: 100 }, data: { text: 'Tell me a joke about programming.' } },
      { id: 'ai1', type: 'llmNode', position: { x: 500, y: 100 }, data: { model: 'gemini-1.5-flash' } },
    ],
    edges: [
      { id: 'e1', source: 't1', target: 'ai1', targetHandle: 'user_message', animated: true, style: { stroke: '#a855f7' } },
    ]
  },
  {
    id: "visual-analyzer",
    name: "Visual Analyzer",
    description: "Upload an image, crop a section, and ask AI to analyze it.",
    nodes: [
      { id: 'img1', type: 'imageNode', position: { x: 50, y: 50 }, data: { label: 'Upload Here' } },
      { id: 'crop1', type: 'cropNode', position: { x: 400, y: 50 }, data: { width: 50, height: 50 } },
      { id: 'txt1', type: 'textNode', position: { x: 400, y: 400 }, data: { text: 'What detail do you see in this cropped section?' } },
      { id: 'ai1', type: 'llmNode', position: { x: 800, y: 200 }, data: { model: 'gemini-1.5-pro' } },
    ],
    edges: [
      { id: 'e1', source: 'img1', target: 'crop1', targetHandle: 'image_url', animated: true },
      { id: 'e2', source: 'crop1', target: 'ai1', targetHandle: 'images', animated: true, style: { stroke: '#f97316' } },
      { id: 'e3', source: 'txt1', target: 'ai1', targetHandle: 'user_message', animated: true, style: { stroke: '#a855f7' } },
    ]
  },
  {
    id: "video-inspector",
    name: "Video Frame Inspector",
    description: "Extract a specific frame from a video and analyze it.",
    nodes: [
      { id: 'vid1', type: 'videoNode', position: { x: 50, y: 50 }, data: { label: 'Upload Video' } },
      { id: 'ext1', type: 'extractNode', position: { x: 400, y: 50 }, data: { timestamp: "5" } },
      { id: 'txt1', type: 'textNode', position: { x: 400, y: 400 }, data: { text: 'Describe the action happening in this frame.' } },
      { id: 'ai1', type: 'llmNode', position: { x: 800, y: 200 }, data: { model: 'gemini-1.5-pro' } },
    ],
    edges: [
      { id: 'e1', source: 'vid1', target: 'ext1', targetHandle: 'video_url', animated: true },
      { id: 'e2', source: 'ext1', target: 'ai1', targetHandle: 'images', animated: true, style: { stroke: '#f97316' } },
      { id: 'e3', source: 'txt1', target: 'ai1', targetHandle: 'user_message', animated: true, style: { stroke: '#a855f7' } },
    ]
  },
  {
    id: "marketing-kit",
    name: "Product Marketing Kit Generator",
    description: "Parallel execution workflow: Processes product image & video simultaneously to generate a final marketing post.",
    nodes: [
      // column 1: inputs
      { 
        id: 'img1', type: 'imageNode', position: { x: 50, y: 50 }, 
        data: { label: 'Product Photo' } 
      },
      { 
        id: 'txt_sys1', type: 'textNode', position: { x: 50, y: 400 }, 
        data: { text: 'You are a professional marketing copywriter. Generate a compelling one-paragraph product description.' } 
      },
      { 
        id: 'txt_prod', type: 'textNode', position: { x: 50, y: 650 }, 
        data: { text: 'Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design.' } 
      },
      { 
        id: 'vid1', type: 'videoNode', position: { x: 50, y: 950 }, 
        data: { label: 'Demo Video' } 
      },

      // column 2: processors
      { 
        id: 'crop1', type: 'cropNode', position: { x: 450, y: 50 }, 
        data: { width: 80, height: 80 } 
      },
      { 
        id: 'ext1', type: 'extractNode', position: { x: 450, y: 950 }, 
        data: { timestamp: "5" } 
      },

      // column 3: intermediate ai
      { 
        id: 'llm1', type: 'llmNode', position: { x: 900, y: 350 }, 
        data: { model: 'gemini-1.5-flash' } 
      },
      { 
        id: 'txt_sys2', type: 'textNode', position: { x: 900, y: 800 }, 
        data: { text: 'You are a social media manager. Create a tweet-length marketing post based on the product image and video frame.' } 
      },

      // column 4: final ai
      { 
        id: 'llm2', type: 'llmNode', position: { x: 1400, y: 500 }, 
        data: { model: 'gemini-1.5-pro' } 
      }
    ],
    edges: [
      // branch a wiring
      { id: 'e1', source: 'img1', target: 'crop1', targetHandle: 'image_url', animated: true },
      { id: 'e2', source: 'crop1', target: 'llm1', targetHandle: 'images', style: { stroke: '#f97316' } },
      { id: 'e3', source: 'txt_sys1', target: 'llm1', targetHandle: 'system_prompt', style: { stroke: '#3b82f6' } },
      { id: 'e4', source: 'txt_prod', target: 'llm1', targetHandle: 'user_message', style: { stroke: '#a855f7' } },

      // branch b wiring
      { id: 'e5', source: 'vid1', target: 'ext1', targetHandle: 'video_url', animated: true },
      
      // convergence wiring (the grand finale)
      { id: 'e6', source: 'txt_sys2', target: 'llm2', targetHandle: 'system_prompt', style: { stroke: '#3b82f6' } },
      { id: 'e7', source: 'llm1', target: 'llm2', targetHandle: 'user_message', animated: true, style: { stroke: '#a855f7' } }, // Chain LLM -> LLM
      { id: 'e8', source: 'crop1', target: 'llm2', targetHandle: 'images', style: { stroke: '#f97316' } }, 
      { id: 'e9', source: 'ext1', target: 'llm2', targetHandle: 'images', style: { stroke: '#f97316' } }, 
    ]
  }
];
