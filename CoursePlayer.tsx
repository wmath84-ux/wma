
import React, { useEffect, useState, useRef } from "react";
import { WebsiteSettings, ProductWithRating, CourseModule, ProductFile } from '../App';
import AiMentor from './AiMentor';

declare global {
    interface Window {
        jspdf: any;
    }
}

// New Note type
interface Note {
    id: string;
    timestamp: number | null; // null for non-timestamped notes
    text: string;
    createdAt: string;
}

// Helper to safely handle Base64 PDFs
const dataURLtoBlob = (dataurl: string) => {
    try {
        if (!dataurl.startsWith('data:')) return null;
        const arr = dataurl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch) return null;
        const mime = mimeMatch[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        return new Blob([u8arr], { type: mime });
    } catch(e) {
        console.error("Blob conversion failed", e);
        return null;
    }
};

// --- FLOATING WINDOW COMPONENT (Desktop) ---
const FloatingWindow: React.FC<{
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    initialPosition?: { x: number, y: number };
}> = ({ title, onClose, children, initialPosition = { x: 20, y: 20 } }) => {
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const windowRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y
                });
            }
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart]);

    return (
        <div 
            ref={windowRef}
            className="fixed z-[100] bg-white/90 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 overflow-hidden flex flex-col w-96 max-h-[600px]"
            style={{ left: position.x, top: position.y }}
        >
            <div 
                className="bg-gradient-to-r from-gray-800 to-gray-900 p-3 flex justify-between items-center cursor-move text-white select-none"
                onMouseDown={handleMouseDown}
            >
                <h3 className="font-bold text-sm tracking-wide">{title}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-white/50">
                {children}
            </div>
        </div>
    );
};

const MobilePanel: React.FC<{
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    colorClass?: string;
}> = ({ title, onClose, children, colorClass = "bg-white" }) => {
    return (
        <div className={`rounded-xl shadow-md overflow-hidden border border-gray-200 animate-fade-in-up mb-4 ${colorClass}`}>
            <div className="p-3 flex justify-between items-center border-b border-gray-200/50 bg-black/5">
                <h3 className="font-bold text-gray-800 text-sm tracking-wide">{title}</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 bg-white/50 rounded-full p-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
                {children}
            </div>
        </div>
    );
};

const TranscriptView: React.FC = () => {
    return (
        <div className="text-gray-700 space-y-4">
            <p className="text-xs text-gray-500 italic mb-4">Transcript generated automatically.</p>
            <p><span className="font-bold text-blue-600">[00:05]</span> Welcome to the course. Today we will discuss the fundamentals of digital marketing.</p>
            <p><span className="font-bold text-blue-600">[00:42]</span> The first pillar is SEO. Search Engine Optimization is crucial for organic growth.</p>
            <p><span className="font-bold text-blue-600">[02:15]</span> Next, let's talk about content strategy. Content is king, as they say.</p>
            <p className="text-sm text-gray-400 mt-8 text-center">... End of preview ...</p>
        </div>
    );
};

const NotesView: React.FC<{ notes: Note[], onAddNote: () => void, onDeleteNote: (id: string) => void, onUpdateNote: (id: string, text: string) => void, onSeek: (time: number) => void, isVideo: boolean, onDownload: () => void }> = ({ notes, onAddNote, onDeleteNote, onUpdateNote, onSeek, isVideo, onDownload }) => {
    return (
        <div className="flex flex-col h-full">
            <div className="flex gap-2 mb-4 border-b pb-4">
                <button 
                    onClick={onAddNote} 
                    className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={!isVideo}
                >
                    + Timestamp Note
                </button>
                <button 
                    onClick={onDownload}
                    className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors"
                    title="Download PDF"
                    disabled={notes.length === 0}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto min-h-[150px]">
                {notes.length === 0 && <p className="text-center text-gray-500 text-sm py-4">No notes yet.</p>}
                {notes.map(note => (
                    <div key={note.id} className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            {note.timestamp !== null ? (
                                <button onClick={() => onSeek(note.timestamp!)} className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200 transition-colors">
                                    {new Date(note.timestamp * 1000).toISOString().substr(11, 8)}
                                </button>
                            ) : <span className="text-xs text-gray-400">General</span>}
                            <button onClick={() => onDeleteNote(note.id)} className="text-red-400 hover:text-red-600">&times;</button>
                        </div>
                        <textarea 
                            value={note.text} 
                            onChange={(e) => onUpdateNote(note.id, e.target.value)}
                            className="w-full bg-transparent text-sm text-gray-700 resize-none focus:outline-none"
                            placeholder="Write something..."
                            rows={2}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

const VideoUnavailablePlaceholder: React.FC = () => (
    <div className="w-full h-full bg-black flex flex-col items-center justify-center text-white p-4 text-center min-h-[200px]">
        <div className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-gray-500 mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h3 className="text-xl font-semibold">Video unavailable</h3>
        <p className="text-gray-400 mt-1">This video is unavailable in this environment.</p>
    </div>
);

const ContentUnavailablePlaceholder: React.FC<{ file: ProductFile }> = ({ file }) => (
    <div className="w-full h-full bg-black flex flex-col items-center justify-center text-white p-4 text-center min-h-[200px]">
        <div className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-gray-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
        <h3 className="text-xl font-semibold">Content Preview Unavailable</h3>
        <p className="text-gray-400 mt-1">This '{file.type}' file cannot be previewed.</p>
         <a href={file.url} download={file.name} className="mt-6 bg-primary text-white font-semibold px-6 py-2 rounded-lg hover:opacity-90 transition-colors">Download File</a>
    </div>
);

const ModuleItem: React.FC<{ module: CourseModule; activeFile: ProductFile | null; onSelectFile: (file: ProductFile) => void; level?: number; }> = ({ module, activeFile, onSelectFile, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  return (
    <div className={`mt-2 ${level > 0 ? "pl-3 border-l-2 border-gray-200" : ""}`}>
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left flex items-center justify-between p-2 rounded hover:bg-gray-100" aria-expanded={isExpanded}>
        <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
            {module.isLocked && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
            )}
            {module.title}
        </span>
        <svg className={`w-4 h-4 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path></svg>
      </button>
      {isExpanded && <div className="pl-2 mt-1">
        {module.files.map((file) => <button key={file.id} onClick={() => onSelectFile(file)} className={`flex items-center w-full text-left p-2 my-1 rounded text-sm transition-colors ${activeFile?.id === file.id ? "bg-blue-100 text-primary font-semibold" : "hover:bg-gray-100 text-gray-700"}`}><svg className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg><span className="truncate">{file.name}</span></button>)}
        {module.modules.map((subModule) => <ModuleItem key={subModule.id} module={subModule} activeFile={activeFile} onSelectFile={onSelectFile} level={level + 1} />)}
      </div>}
    </div>
  );
};

const extractYouTubeID = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) return match[2];
    return null;
};

/* ---------- MAIN COMPONENT ---------- */
interface CoursePlayerProps {
    settings: WebsiteSettings;
    product: ProductWithRating;
    onBack: () => void;
    purchasedIds: (number|string)[];
    onPurchaseModule: (moduleId: string, price: string, paymentLink: string) => void;
}

export function CoursePlayer({ settings, product, onBack, purchasedIds, onPurchaseModule }: CoursePlayerProps) {
  const [activeFile, setActiveFile] = useState<ProductFile | null>(null);
  const [activeModule, setActiveModule] = useState<CourseModule | null>(null);
  const [mediaError, setMediaError] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  
  // Feature Toggles
  const [showMentor, setShowMentor] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showModules, setShowModules] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [headerHovered, setHeaderHovered] = useState(false);

  // Find first piece of content on product load
  useEffect(() => {
    const findFirst = (modules?: CourseModule[]): { file: ProductFile | null, module: CourseModule | null } => {
      if (!modules) return { file: null, module: null };
      for (const m of modules) {
        if (m.files.length) return { file: m.files[0], module: m };
        const found = findFirst(m.modules);
        if (found.file) return found;
      }
      return { file: null, module: null };
    };
    const { file, module } = findFirst(product.courseContent);
    setActiveFile(file);
    setActiveModule(module);
  }, [product]);

  // Check Lock Status whenever module changes
  useEffect(() => {
      if (activeModule?.isLocked) {
          // 1. Check if this specific module is purchased
          const isModulePurchased = purchasedIds.includes(activeModule.id);
          
          // 2. Check if user has a valid subscription
          const tiers = settings.content.subscriptionTiers || [];
          const hasValidSubscription = tiers.some(tier => {
              // Is this tier purchased?
              if (!purchasedIds.includes(tier.id)) return false;
              
              // Does this tier unlock this product?
              if (tier.productAccess === 'all') return true;
              if (tier.productAccess === 'specific' && tier.accessProductIds?.includes(product.id)) return true;
              
              return false;
          });

          if (!isModulePurchased && !hasValidSubscription) {
              setIsLocked(true);
          } else {
              setIsLocked(false);
          }
      } else {
          setIsLocked(false);
      }
  }, [activeModule, purchasedIds, settings.content.subscriptionTiers, product.id]);

  // Handle PDF Blob URL creation
  useEffect(() => {
    if (activeFile?.type === 'pdf' && activeFile.url.startsWith('data:')) {
        const blob = dataURLtoBlob(activeFile.url);
        if (blob) {
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    } else {
        setPdfUrl(activeFile?.url || null);
    }
  }, [activeFile]);

  // Load/Save notes
  useEffect(() => {
    if (activeFile?.id) {
      const savedNotes = localStorage.getItem(`video-notes-${activeFile.id}`);
      setNotes(savedNotes ? JSON.parse(savedNotes) : []);
    } else {
      setNotes([]);
    }
  }, [activeFile]);

  useEffect(() => {
    if (activeFile?.id) {
      localStorage.setItem(`video-notes-${activeFile.id}`, JSON.stringify(notes));
    }
  }, [notes, activeFile?.id]);

  const onSelectFile = (file: ProductFile) => { 
      // Find parent module for this file to check locking
      const findModuleForFile = (modules: CourseModule[]): CourseModule | null => {
          for(const m of modules) {
              if (m.files.some(f => f.id === file.id)) return m;
              const found = findModuleForFile(m.modules || []);
              if (found) return found;
          }
          return null;
      };
      const parentModule = findModuleForFile(product.courseContent || []);
      setActiveModule(parentModule);
      setActiveFile(file); 
      setMediaError(false); 
  };

  // ... (Notes Handlers - UNCHANGED) ...
  const handleAddTimestampedNote = () => { if (videoRef.current) { const currentTime = videoRef.current.currentTime; const newNote: Note = { id: `note-${Date.now()}`, timestamp: currentTime, text: '', createdAt: new Date().toISOString() }; setNotes(prev => [newNote, ...prev]); } else { const newNote: Note = { id: `note-${Date.now()}`, timestamp: null, text: '', createdAt: new Date().toISOString() }; setNotes(prev => [newNote, ...prev]); } };
  const handleDeleteNote = (id: string) => setNotes(prev => prev.filter(note => note.id !== id));
  const handleUpdateNoteText = (id: string, text: string) => setNotes(prev => prev.map(note => note.id === id ? { ...note, text } : note));
  const handleSeekToTime = (time: number) => { if (videoRef.current) videoRef.current.currentTime = time; };
  const handleDownloadNotes = () => { if (notes.length === 0) return; if (!window.jspdf) { alert('PDF library not loaded.'); return; } const { jsPDF } = window.jspdf; const doc = new jsPDF(); doc.text(`Notes: ${activeFile?.name || 'Course Content'}`, 10, 10); let y = 20; notes.forEach(n => { const time = n.timestamp ? `[${new Date(n.timestamp * 1000).toISOString().substr(11, 8)}] ` : ''; doc.text(`${time}${n.text}`, 10, y); y += 10; }); doc.save('notes.pdf'); };

  const renderMedia = () => {
    if (!activeFile) return <div className="flex items-center justify-center h-full w-full bg-black text-gray-400 p-10">Select content to begin.</div>;
    
    // Locked View
    if (isLocked) {
        return (
            <div className="relative w-full h-full flex items-center justify-center bg-gray-900 overflow-hidden">
                {/* Blurred Content Placeholder */}
                <div className="absolute inset-0 blur-xl opacity-30 bg-[url('https://picsum.photos/seed/lock/1200/800')] bg-cover bg-center pointer-events-none"></div>
                
                <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl text-center max-w-md mx-4">
                    <div className="bg-orange-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Content Locked</h3>
                    <p className="text-gray-300 mb-6">This chapter is part of our premium curriculum. Purchase it individually or upgrade to a subscription plan.</p>
                    
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => activeModule && onPurchaseModule(activeModule.id, activeModule.individualPrice || '13', activeModule.paymentLink || '')}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg"
                        >
                            Unlock Chapter for ₹{activeModule?.individualPrice || '13'}
                        </button>
                        <button className="text-white/70 text-sm hover:text-white hover:underline">
                            View Subscription Plans
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (mediaError) return <ContentUnavailablePlaceholder file={activeFile} />;
    
    // Normal Rendering
    switch (activeFile.type) {
        case 'youtube': {
            const videoId = extractYouTubeID(activeFile.url);
            return videoId ? <div className="relative w-full h-full bg-black"><iframe key={activeFile.id} className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&fs=0`} title={activeFile.name} frameBorder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen onError={() => setMediaError(true)}></iframe></div> : <VideoUnavailablePlaceholder />;
        }
        case 'video': return <video ref={videoRef} key={activeFile.id} src={activeFile.url} controls className="w-full h-full bg-black object-contain" onError={() => setMediaError(true)} />;
        case 'pdf': return (
            <div className="w-full h-full relative bg-gray-800 flex items-center justify-center">
                {/* Fallback for mobile/black screen */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none z-0">
                    <p className="text-gray-400 mb-2">Preview not displaying?</p>
                    <a 
                        href={pdfUrl || activeFile.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="pointer-events-auto bg-blue-600 text-white px-6 py-2 rounded-full shadow hover:bg-blue-500 transition-colors"
                    >
                        Open PDF in New Tab
                    </a>
                </div>
                <iframe 
                    src={pdfUrl || activeFile.url} 
                    className="w-full h-full relative z-10 bg-white" 
                    title={activeFile.name}
                ></iframe>
            </div>
        );
        default: return <div className="w-full h-full flex items-center justify-center bg-gray-100"><ContentUnavailablePlaceholder file={activeFile} /></div>;
    }
  };

  // ... (HeaderButton, HeaderContent, Content Components - UNCHANGED) ...
  const HeaderButton: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
      <button 
        onClick={onClick} 
        className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${active ? 'bg-white/20 text-white shadow-inner' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
      >
          <div className="w-5 h-5">{icon}</div>
          <span className="text-[10px] font-bold uppercase tracking-wider leading-none">{label}</span>
      </button>
  );

  const HeaderContent = ({ isMobile }: { isMobile?: boolean }) => (
    <div className={`flex items-center justify-between w-full ${isMobile ? 'text-white' : 'bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-md rounded-2xl p-2 border border-white/20'}`}>
        <button onClick={onBack} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isMobile ? 'text-white hover:bg-white/20' : 'text-white/90 hover:text-white hover:bg-white/10'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            <span className="text-xs font-bold uppercase tracking-wider">Back</span>
        </button>
        <div className={`flex gap-1 sm:gap-2 overflow-x-auto no-scrollbar px-2 ${isMobile ? 'justify-end' : ''}`}>
            <HeaderButton active={showModules} onClick={() => setShowModules(!showModules)} label="Modules" icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M2.625 6.75a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0A.75.75 0 018.25 6h12.75a.75.75 0 010 1.5H8.25A.75.75 0 017.5 6.75zM2.625 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zM7.5 12a.75.75 0 01.75-.75h12.75a.75.75 0 010 1.5H8.25A.75.75 0 017.5 12zm-4.875 5.25a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0a.75.75 0 01.75-.75h12.75a.75.75 0 010 1.5H8.25a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>} />
            <HeaderButton active={showMentor} onClick={() => setShowMentor(!showMentor)} label="AI Mentor" icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>} />
            <HeaderButton active={showNotes} onClick={() => setShowNotes(!showNotes)} label="Notes" icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" /></svg>} />
            <HeaderButton active={showTranscript} onClick={() => setShowTranscript(!showTranscript)} label="Transcript" icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M4.125 3C3.089 3 2.25 3.84 2.25 4.875V18a3 3 0 003 3h15a3 3 0 01-3-3V4.875C17.25 3.84 16.411 3 15.375 3H4.125zM12 9.75a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5H12zm-.75-2.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H12a.75.75 0 01-.75-.75zM6 12.75a.75.75 0 000 1.5h7.5a.75.75 0 000-1.5H6zm-.75 3.75a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5H6a.75.75 0 01-.75-.75zM6 6.75a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5H6z" clipRule="evenodd" /></svg>} />
        </div>
    </div>
  );

  const ModulesContent = () => <div className="h-full overflow-y-auto">{product.courseContent?.map(m => <ModuleItem key={m.id} module={m} activeFile={activeFile} onSelectFile={onSelectFile} />) || <p className="p-4 text-center text-gray-500 text-sm">No content available.</p>}</div>;
  const MentorContent = () => <div className="h-full flex flex-col"><AiMentor productTitle={product.title} activeContentName={activeFile?.name || null} settings={settings} /></div>;
  const NotesContent = () => <div className="h-full"><NotesView notes={notes} onAddNote={handleAddTimestampedNote} onDeleteNote={handleDeleteNote} onUpdateNote={handleUpdateNoteText} onSeek={handleSeekToTime} isVideo={activeFile?.type === 'video' || activeFile?.type === 'youtube'} onDownload={handleDownloadNotes} /></div>;
  const TranscriptContent = () => <div className="h-full overflow-y-auto"><TranscriptView /></div>;

  return (
    <div className="fixed inset-0 z-50 h-[100dvh] w-screen bg-black overflow-hidden">
      {/* DESKTOP LAYOUT */}
      <div className="hidden md:block relative w-full h-full">
        <div className="absolute inset-0 flex items-center justify-center">{renderMedia()}</div>
        <div className={`absolute top-0 left-0 right-0 z-40 p-4 transition-all duration-300 ${headerHovered || showModules || showMentor || showNotes || showTranscript ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 hover:opacity-100 hover:translate-y-0'}`} onMouseEnter={() => setHeaderHovered(true)} onMouseLeave={() => setHeaderHovered(false)}>
            <div className="max-w-4xl mx-auto"><HeaderContent isMobile={false} /></div>
        </div>
        {showModules && <FloatingWindow title="Course Content" onClose={() => setShowModules(false)} initialPosition={{ x: 20, y: 100 }}><ModulesContent /></FloatingWindow>}
        {showMentor && <FloatingWindow title="AI Mentor" onClose={() => setShowMentor(false)} initialPosition={{ x: 350, y: 100 }}><MentorContent /></FloatingWindow>}
        {showNotes && <FloatingWindow title="My Notes" onClose={() => setShowNotes(false)} initialPosition={{ x: 680, y: 100 }}><NotesContent /></FloatingWindow>}
        {showTranscript && <FloatingWindow title="Video Transcript" onClose={() => setShowTranscript(false)} initialPosition={{ x: 20, y: 520 }}><TranscriptContent /></FloatingWindow>}
      </div>

      {/* MOBILE LAYOUT */}
      <div className="md:hidden flex flex-col h-full bg-gray-50">
         <div className="shrink-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-2 shadow-md z-50"><HeaderContent isMobile={true} /></div>
         <div className="flex-1 overflow-y-auto">
             <div className="w-full aspect-video bg-black shrink-0 sticky top-0 z-40 shadow-xl">{renderMedia()}</div>
             <div className="p-4 space-y-4 min-h-[300px]">
                 {showModules && <MobilePanel title="Course Content" onClose={() => setShowModules(false)} colorClass="bg-blue-50/50 border-blue-100"><ModulesContent /></MobilePanel>}
                 {showMentor && <MobilePanel title="AI Mentor" onClose={() => setShowMentor(false)} colorClass="bg-purple-50/50 border-purple-100"><div className="h-[400px]"><MentorContent /></div></MobilePanel>}
                 {showNotes && <MobilePanel title="My Notes" onClose={() => setShowNotes(false)} colorClass="bg-yellow-50/50 border-yellow-100"><div className="h-[300px]"><NotesContent /></div></MobilePanel>}
                 {showTranscript && <MobilePanel title="Video Transcript" onClose={() => setShowTranscript(false)} colorClass="bg-green-50/50 border-green-100"><TranscriptContent /></MobilePanel>}
                 {!showModules && !showMentor && !showNotes && !showTranscript && (
                     <div className="flex flex-col items-center justify-center text-gray-400 h-40 mt-4">
                         <p className="text-lg font-medium">Select a tool above</p>
                         <div className="w-1 h-8 bg-gray-300 my-2 rounded-full animate-pulse"></div>
                         <p className="text-xs">to view content here.</p>
                     </div>
                 )}
             </div>
         </div>
      </div>
    </div>
  );
}

export default CoursePlayer;
