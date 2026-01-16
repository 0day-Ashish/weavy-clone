"use client";

import React, { useEffect, useState } from 'react';
import '@uppy/core/css/style.css';
import '@uppy/dashboard/css/style.css';
import Uppy from '@uppy/core';
import Transloadit from '@uppy/transloadit';
// @ts-ignore
import DashboardModal from '@uppy/react/dashboard-modal';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';

export function UploadButton({ onUploadComplete }: { onUploadComplete: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  const [uppy, setUppy] = useState<Uppy | null>(null);

  useEffect(() => {
    // initialize uppy only inside use effect (client-side only)
    const uppyInstance = new Uppy({
      restrictions: { 
        maxNumberOfFiles: 1,
        allowedFileTypes: ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov'] 
      },
      autoProceed: false, 
    })
    .use(Transloadit, {
      waitForEncoding: true,
      assemblyOptions: {
        params: {
          auth: { key: process.env.NEXT_PUBLIC_TRANSLOADIT_KEY || "" },
          template_id: process.env.NEXT_PUBLIC_TRANSLOADIT_TEMPLATE_ID || ""
        }
      }
    });

    // handle success
    uppyInstance.on('transloadit:complete', (assembly) => {
      // get the URL of the original file
      // try to get SSL URL first, then regular URL, then look in uploads if results are missing
      const original = assembly.results?.[':original']?.[0];
      let url = original?.ssl_url || original?.url;

      // fallback: sometimes transloadit puts the file in 'uploads' if no steps were run
      if (!url && assembly.uploads && assembly.uploads.length > 0) {
        url = assembly.uploads[0].ssl_url || assembly.uploads[0].url;
      }
      
      if (url) {
        console.log("Upload Success:", url);
        onUploadComplete(url);
        setOpen(false);
      } else {
        console.error("Could not find upload URL in assembly:", assembly);
      }
    });
    
    // handle errors
    uppyInstance.on('error', (error) => {
      console.error("Uppy Error:", error);
    });

    setUppy(uppyInstance);

    // cleanup when component unmounts
    return () => {
      uppyInstance.destroy();
    };
  }, [onUploadComplete]);

  return (
    <>
      <Button 
        variant="outline" 
        className="w-full flex gap-2 justify-start border-dashed border-white/20 bg-black/50 text-white hover:bg-white/10 hover:text-white" 
        onClick={() => setOpen(true)}
      >
        <UploadCloud className="w-4 h-4" />
        Upload Media
      </Button>

      {/* only render the modal if uppy is initialized */}
      {uppy && (
        <DashboardModal
          uppy={uppy}
          open={open}
          onRequestClose={() => setOpen(false)}
          closeModalOnClickOutside
          theme="light"
        />
      )}
    </>
  );
}