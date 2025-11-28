
import React, { useState, useRef, useEffect } from 'react';
import { Product, ProductWithRating, ProductFile, CourseModule, ProductFileType, Coupon, User, WebsiteSettings } from '../../App';
import NewProductEmailPreviewModal from './NewProductEmailPreviewModal';

const recursiveUpdate = (
    modules: CourseModule[], 
    parentId: string | null, 
    updateCallback: (modules: CourseModule[]) => CourseModule[]
): CourseModule[] => {
    if (!modules) return []; 
    if (parentId === null) return updateCallback(modules);
    return modules.map(module => {
        if (module.id === parentId) {
            const currentModules = Array.isArray(module.modules) ? module.modules : [];
            return { ...module, modules: updateCallback(currentModules) };
        }
        if (module.modules && module.modules.length > 0) {
            return { ...module, modules: recursiveUpdate(module.modules, parentId, updateCallback) };
        }
        return module;
    });
};

const recursiveFileUpdate = (
    modules: CourseModule[], 
    moduleId: string, 
    updateCallback: (files: ProductFile[]) => ProductFile[]
): CourseModule[] => {
    if (!modules) return [];
    return modules.map(module => {
        if (module.id === moduleId) {
            const currentFiles = Array.isArray(module.files) ? module.files : [];
            return { ...module, files: updateCallback(currentFiles) };
        }
        if (module.modules && module.modules.length > 0) {
            return { ...module, modules: recursiveFileUpdate(module.modules, moduleId, updateCallback) };
        }
        return module;
    });
};

// ... (AddContentModal - UNCHANGED) ...
// Updated Modal to support EDITING and PREVENT CRASHES on large files
const AddContentModal: React.FC<{ 
    onSave: (file: Omit<ProductFile, 'id'>) => void; 
    onClose: () => void; 
    initialData?: ProductFile | null; 
}> = ({ onSave, onClose, initialData }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadConfig, setUploadConfig] = useState<{type: ProductFileType, accept: string} | null>(null);
    
    const [view, setView] = useState<'selection' | 'form'>(initialData ? 'form' : 'selection');
    
    // Initialize state.
    const [formState, setFormState] = useState<{type: ProductFileType, url: string, name: string} | null>(
        initialData 
            ? { type: initialData.type, url: initialData.url, name: initialData.name } 
            : null
    );
    const [isUploading, setIsUploading] = useState(false);
    const [fileSizeError, setFileSizeError] = useState<string | null>(null);

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileSizeError(null);
        if (e.target.files && e.target.files[0] && uploadConfig) {
            const file = e.target.files[0];
            
            // SAFETY LIMIT: 5MB (Browser LocalStorage Hard Limit)
            if (file.size > 5 * 1024 * 1024) {
                setFileSizeError(`File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Max limit for LocalStorage mode is 5MB.`);
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }

            setIsUploading(true);
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setFormState({
                        name: file.name,
                        type: uploadConfig.type,
                        url: event.target.result as string
                    });
                    setView('form');
                    setIsUploading(false);
                }
            };
            reader.onerror = () => {
                setFileSizeError("Error reading file.");
                setIsUploading(false);
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = ""; 
        setUploadConfig(null);
    };

    const triggerFileUpload = (type: ProductFileType, accept: string) => { 
        setFileSizeError(null);
        setUploadConfig({ type, accept }); 
        setTimeout(() => fileInputRef.current?.click(), 0);
    };

    const showLinkForm = (type: ProductFileType) => { 
        setFormState({ 
            type, 
            url: '', 
            name: type === 'youtube' ? 'YouTube Video' : ''
        }); 
        setView('form'); 
    };

    const handleSaveClick = () => { 
        if (formState?.url && formState?.name) { 
            onSave({ name: formState.name, type: formState.type, url: formState.url }); 
        }
    };

    const isDataUrl = (url: string) => url.startsWith('data:');
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-pop-in">
                 <button 
                    type="button"
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
                 
                 <h3 className="text-2xl font-bold text-center mb-6 text-slate-800">
                     {initialData ? 'Edit Content' : 'Add Content'}
                 </h3>

                 {fileSizeError && (
                     <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                         {fileSizeError}
                     </div>
                 )}

                 {isUploading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-blue-600 font-semibold">Uploading file...</p>
                    </div>
                 ) : view === 'selection' ? (
                    <div className="grid gap-3">
                        <p className="text-sm text-gray-500 text-center mb-2">Select content type:</p>
                        <button type="button" onClick={() => triggerFileUpload('pdf', '.pdf')} className="p-4 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-400 hover:shadow-md transition-all text-left flex items-center gap-4 group">
                            <div className="bg-red-100 p-2 rounded-lg text-red-600"><span className="text-xl">📄</span></div>
                            <span className="font-semibold text-slate-700 group-hover:text-blue-700">Upload PDF Document</span>
                        </button>
                        <button type="button" onClick={() => triggerFileUpload('video', 'video/*')} className="p-4 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-400 hover:shadow-md transition-all text-left flex items-center gap-4 group">
                            <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><span className="text-xl">🎥</span></div>
                            <span className="font-semibold text-slate-700 group-hover:text-blue-700">Upload Video (MP4)</span>
                        </button>
                        <button type="button" onClick={() => showLinkForm('youtube')} className="p-4 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-400 hover:shadow-md transition-all text-left flex items-center gap-4 group">
                            <div className="bg-red-100 p-2 rounded-lg text-red-600"><span className="text-xl">▶️</span></div>
                            <span className="font-semibold text-slate-700 group-hover:text-blue-700">Add YouTube Link</span>
                        </button>
                        <button type="button" onClick={() => showLinkForm('link')} className="p-4 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-400 hover:shadow-md transition-all text-left flex items-center gap-4 group">
                            <div className="bg-gray-100 p-2 rounded-lg text-gray-600"><span className="text-xl">🔗</span></div>
                            <span className="font-semibold text-slate-700 group-hover:text-blue-700">External Link</span>
                        </button>
                    </div>
                 ) : (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Title / Name</label>
                            <input 
                                value={formState?.name || ''} 
                                onChange={e => setFormState(prev => prev ? {...prev, name: e.target.value} : null)} 
                                placeholder="e.g., Chapter 1 Notes" 
                                required 
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                                onKeyDown={(e) => { if(e.key === 'Enter') e.preventDefault(); }}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">
                                {isDataUrl(formState?.url || '') ? "File Status" : "URL / Link"}
                            </label>
                            
                            {isDataUrl(formState?.url || '') ? (
                                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    File Ready ({(formState!.url.length / 1024 / 1.33).toFixed(2)} KB)
                                    <button 
                                        type="button"
                                        onClick={() => { setView('selection'); setFormState(null); }}
                                        className="ml-auto text-xs underline hover:text-green-900"
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <input 
                                    value={formState?.url || ''} 
                                    onChange={e => setFormState(prev => prev ? {...prev, url: e.target.value} : null)} 
                                    placeholder="https://..." 
                                    required 
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm" 
                                    onKeyDown={(e) => { if(e.key === 'Enter') e.preventDefault(); }}
                                />
                            )}
                        </div>

                        <div className="flex gap-3 pt-4 border-t">
                            {!initialData && (
                                <button 
                                    type="button" 
                                    onClick={() => setView('selection')} 
                                    className="flex-1 py-2.5 border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Back
                                </button>
                            )}
                            <button 
                                type="button"
                                onClick={handleSaveClick}
                                className="flex-1 bg-blue-600 text-white py-2.5 font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all transform active:scale-95"
                            >
                                {initialData ? 'Save Changes' : 'Add Content'}
                            </button>
                        </div>
                    </div>
                 )}
                 <input type="file" ref={fileInputRef} className="hidden" accept={uploadConfig?.accept} onChange={handleFileSelected} />
            </div>
        </div>
    );
};

interface ModuleEditorProps {
    modules: CourseModule[];
    onChange: (modules: CourseModule[]) => void;
    onAddContent: (moduleId: string) => void;
    onEditContent: (moduleId: string, file: ProductFile) => void;
}

const ModuleEditor: React.FC<ModuleEditorProps> = ({ modules, onChange, onAddContent, onEditContent }) => {
    const addModule = (parentId: string | null = null) => {
        const newModule: CourseModule = { id: `mod-${Date.now()}`, title: 'New Module', files: [], modules: [] };
        onChange(recursiveUpdate(modules || [], parentId, (currentModules) => [...currentModules, newModule]));
    };
    
    const deleteModule = (id: string) => {
        if(window.confirm("Delete this module and all its content?")) {
            onChange(modules.filter(m => m.id !== id));
        }
    };
    
    const updateModule = (id: string, updatedFields: Partial<CourseModule>) => {
        onChange(modules.map(m => m.id === id ? { ...m, ...updatedFields } : m));
    };

    const deleteFile = (moduleId: string, fileId: string) => {
        if (window.confirm("Delete this file?")) {
            onChange(recursiveFileUpdate(modules, moduleId, (files) => files.filter(f => f.id !== fileId)));
        }
    };

    return (
        <div className="space-y-4">
            {modules?.map(module => (
                <div key={module.id} className={`border rounded-lg p-4 ${module.isLocked ? 'bg-orange-50 border-orange-200' : 'bg-slate-50/50 border-slate-200'}`}>
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <input 
                                value={module.title} 
                                onChange={(e) => updateModule(module.id, { title: e.target.value })} 
                                className="font-bold text-slate-800 bg-transparent border-b-2 border-transparent hover:border-slate-300 focus:border-blue-500 outline-none px-1 py-0.5 transition-colors w-full mr-4" 
                                onKeyDown={(e) => { if(e.key === 'Enter') e.preventDefault(); }}
                            />
                            <div className="flex items-center space-x-2 flex-shrink-0">
                                <button type="button" onClick={() => onAddContent(module.id)} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-200 font-semibold transition-colors flex items-center gap-1">
                                    <span>+</span> Content
                                </button>
                                <button type="button" onClick={() => deleteModule(module.id)} className="text-gray-400 hover:text-red-500 p-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Module Locking Controls */}
                        <div className="flex flex-wrap gap-4 items-center bg-white p-2 rounded border border-gray-100">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={module.isLocked || false} 
                                    onChange={(e) => updateModule(module.id, { isLocked: e.target.checked })}
                                    className="rounded text-orange-500 focus:ring-orange-500"
                                />
                                Lock Module
                            </label>
                            
                            {module.isLocked && (
                                <>
                                    <input 
                                        placeholder="Unlock Price (₹)" 
                                        value={module.individualPrice || ''}
                                        onChange={(e) => updateModule(module.id, { individualPrice: e.target.value })}
                                        className="border rounded px-2 py-1 text-sm w-32"
                                    />
                                    <input 
                                        placeholder="Payment Link (Razorpay)" 
                                        value={module.paymentLink || ''}
                                        onChange={(e) => updateModule(module.id, { paymentLink: e.target.value })}
                                        className="border rounded px-2 py-1 text-sm w-48 flex-1"
                                    />
                                </>
                            )}
                        </div>
                    </div>
                    
                    <div className="space-y-2 pl-0 sm:pl-4 mt-3">
                        {module.files.length === 0 && <p className="text-xs text-slate-400 italic">No content in this module yet.</p>}
                        {module.files.map(file => (
                            <div key={file.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                                <span className="flex items-center gap-3 text-slate-700 text-sm font-medium overflow-hidden">
                                    <span className="flex-shrink-0 text-lg">
                                        {file.type === 'pdf' ? '📄' : file.type === 'video' || file.type === 'youtube' ? '🎥' : '🔗'}
                                    </span>
                                    <span className="truncate">{file.name}</span>
                                </span>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        type="button"
                                        onClick={() => onEditContent(module.id, file)}
                                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                        title="Edit"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => deleteFile(module.id, file.id)} 
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                        title="Delete"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <button 
                type="button" 
                onClick={() => addModule(null)} 
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 font-bold transition-all flex items-center justify-center gap-2"
            >
                <span className="text-xl">+</span> Add New Module
            </button>
        </div>
    );
};

// ... (FIXED_CATEGORIES and ProductFormModal - UNCHANGED but imports updated) ...
const FIXED_CATEGORIES = ["E-books", "Online Courses", "Digital Goods", "Templates", "Software"];

const ProductFormModal: React.FC<{ product?: Product | null; onSave: (product: Product) => void; onClose: () => void; availableCoupons: Coupon[]; settings: WebsiteSettings; }> = ({ product, onSave, onClose, availableCoupons, settings }) => {
    const [formData, setFormData] = useState<Partial<Product>>({
        title: '', description: '', longDescription: '', price: '', salePrice: '', salePriceExpiry: '', category: FIXED_CATEGORIES[0], department: 'Unisex', inStock: true, isVisible: true, sku: '', tags: [], features: [], images: [], courseContent: [], imageSeed: 'product', isFree: false, couponCode: '', manualRating: 5,
        ...product
    });
    
    const [contentModal, setContentModal] = useState<{ isOpen: boolean; moduleId: string | null; file: ProductFile | null }>({
        isOpen: false, moduleId: null, file: null
    });

    const [tagInput, setTagInput] = useState('');
    const [featureInput, setFeatureInput] = useState('');
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [titleError, setTitleError] = useState('');

    useEffect(() => {
        if (product && product.category && !FIXED_CATEGORIES.includes(product.category)) {
            setIsCustomCategory(true);
        }
    }, [product]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
        
        if (name === 'title') {
            const minLen = settings.validation?.productTitleMinLength || 3;
            if (value.length < minLen) {
                setTitleError(`Title must be at least ${minLen} characters long.`);
            } else {
                setTitleError('');
            }
        }
    };

    const handleAddTag = () => { if (tagInput.trim()) { setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] })); setTagInput(''); } };
    const handleRemoveTag = (idx: number) => setFormData(prev => ({ ...prev, tags: prev.tags?.filter((_, i) => i !== idx) }));
    
    const handleAddFeature = () => { if (featureInput.trim()) { setFormData(prev => ({ ...prev, features: [...(prev.features || []), featureInput.trim()] })); setFeatureInput(''); } };
    const handleRemoveFeature = (idx: number) => setFormData(prev => ({ ...prev, features: prev.features?.filter((_, i) => i !== idx) }));

    const handleAddImage = () => { if (imageUrlInput.trim()) { setFormData(prev => ({ ...prev, images: [...(prev.images || []), imageUrlInput.trim()] })); setImageUrlInput(''); } };
    const handleRemoveImage = (idx: number) => setFormData(prev => ({ ...prev, images: prev.images?.filter((_, i) => i !== idx) }));

    const handleSubmit = (e: React.FormEvent) => { 
        e.preventDefault(); 
        const minLen = settings.validation?.productTitleMinLength || 3;
        if (!formData.title || formData.title.length < minLen) {
            setTitleError(`Title must be at least ${minLen} characters long.`);
            return;
        }
        onSave(formData as Product); 
    };

    const handleContentSave = (fileData: Omit<ProductFile, 'id'>) => {
        const { moduleId, file } = contentModal;
        if (!moduleId) return;
        
        setFormData(prev => {
            const currentModules = prev.courseContent || [];
            if (file) {
                 return { ...prev, courseContent: recursiveFileUpdate(currentModules, moduleId, (files) => files.map(f => f.id === file.id ? { ...f, ...fileData } : f)) };
            } else {
                 const newFile = { ...fileData, id: `file-${Date.now()}` };
                 return { ...prev, courseContent: recursiveFileUpdate(currentModules, moduleId, (files) => [...files, newFile]) };
            }
        });
        setContentModal({ isOpen: false, moduleId: null, file: null });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col animate-scale-in-up">
                <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800">{product ? 'Edit Product' : 'Add New Product'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Title <span className="text-red-500">*</span></label>
                                <input 
                                    name="title" 
                                    value={formData.title} 
                                    onChange={handleChange} 
                                    className={`w-full p-2 border rounded mt-1 ${titleError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                                    required 
                                    minLength={settings.validation?.productTitleMinLength || 3}
                                />
                                {titleError && <p className="text-xs text-red-500 mt-1">{titleError}</p>}
                            </div>
                            
                            <div><label className="block text-sm font-semibold text-gray-700">Price (e.g., ₹499) <span className="text-red-500">*</span></label><input name="price" value={formData.price} onChange={handleChange} className="w-full p-2 border rounded mt-1" required /></div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700">Sale Price</label>
                                    <input name="salePrice" value={formData.salePrice} onChange={handleChange} className="w-full p-2 border rounded mt-1" placeholder="e.g. ₹299" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700">Sale Expiry</label>
                                    <input 
                                        name="salePriceExpiry" 
                                        type="datetime-local" 
                                        value={formData.salePriceExpiry || ''} 
                                        onChange={handleChange} 
                                        className="w-full p-2 border rounded mt-1 text-sm" 
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                                {isCustomCategory ? (
                                    <div className="flex gap-2 animate-fade-in">
                                        <input 
                                            name="category" 
                                            value={formData.category} 
                                            onChange={handleChange} 
                                            placeholder="Enter custom category" 
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent" 
                                            required 
                                            autoFocus
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => { setIsCustomCategory(false); setFormData(prev => ({...prev, category: FIXED_CATEGORIES[0]})); }}
                                            className="bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300 text-sm font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <select 
                                        name="category" 
                                        value={formData.category} 
                                        onChange={(e) => {
                                            if (e.target.value === 'custom') {
                                                setIsCustomCategory(true);
                                                setFormData(prev => ({...prev, category: ''}));
                                            } else {
                                                handleChange(e);
                                            }
                                        }} 
                                        className="w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    >
                                        {FIXED_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                        <option value="custom" className="font-bold text-blue-600">+ Add New Category</option>
                                    </select>
                                )}
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                                <label className="flex items-center space-x-2"><input type="checkbox" name="inStock" checked={formData.inStock} onChange={handleChange} className="form-checkbox text-primary" /><span>In Stock</span></label>
                                <label className="flex items-center space-x-2"><input type="checkbox" name="isVisible" checked={formData.isVisible} onChange={handleChange} className="form-checkbox text-primary" /><span>Visible in Store</span></label>
                                <label className="flex items-center space-x-2"><input type="checkbox" name="isFree" checked={formData.isFree} onChange={handleChange} className="form-checkbox text-primary" /><span>Free Product</span></label>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Link Coupon (Optional)</label>
                                <select name="couponCode" value={formData.couponCode || ''} onChange={handleChange} className="w-full p-2 border rounded mt-1">
                                    <option value="">-- No Coupon --</option>
                                    {availableCoupons.filter(c => c.isActive).map(c => (
                                        <option key={c.id} value={c.code}>{c.code} ({c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-semibold text-gray-700">Short Description</label><textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded mt-1" rows={2} /></div>
                            <div><label className="block text-sm font-semibold text-gray-700">Long Description</label><textarea name="longDescription" value={formData.longDescription} onChange={handleChange} className="w-full p-2 border rounded mt-1" rows={4} /></div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Images (URLs)</label>
                                <div className="flex gap-2 mt-1">
                                    <input value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)} placeholder="https://..." className="flex-1 p-2 border rounded" />
                                    <button type="button" onClick={handleAddImage} className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700">Add</button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.images?.map((img, i) => (
                                        <div key={i} className="relative w-16 h-16 border rounded overflow-hidden group">
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => handleRemoveImage(i)} className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center font-bold">×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Tags</label>
                            <div className="flex gap-2 mb-2"><input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add tag" className="flex-1 p-2 border rounded" /><button type="button" onClick={handleAddTag} className="bg-gray-200 px-4 rounded hover:bg-gray-300">Add</button></div>
                            <div className="flex flex-wrap gap-2">{formData.tags?.map((tag, i) => <span key={i} className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center gap-1">{tag} <button type="button" onClick={() => handleRemoveTag(i)} className="text-red-500 font-bold">×</button></span>)}</div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Key Features</label>
                            <div className="flex gap-2 mb-2"><input value={featureInput} onChange={e => setFeatureInput(e.target.value)} placeholder="Add feature" className="flex-1 p-2 border rounded" /><button type="button" onClick={handleAddFeature} className="bg-gray-200 px-4 rounded hover:bg-gray-300">Add</button></div>
                            <ul className="list-disc list-inside text-sm text-gray-600">{formData.features?.map((feat, i) => <li key={i} className="truncate flex justify-between items-center"><span>{feat}</span><button type="button" onClick={() => handleRemoveFeature(i)} className="text-red-500 ml-2 font-bold">×</button></li>)}</ul>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Course Content / Files</h3>
                        <ModuleEditor 
                            modules={formData.courseContent || []} 
                            onChange={(newModules) => setFormData(prev => ({ ...prev, courseContent: newModules }))} 
                            onAddContent={(moduleId) => setContentModal({ isOpen: true, moduleId, file: null })}
                            onEditContent={(moduleId, file) => setContentModal({ isOpen: true, moduleId, file })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t">
                        <button type="button" onClick={onClose} className="px-6 py-2 text-gray-600 hover:bg-gray-100 font-bold rounded-lg">Cancel</button>
                        <button type="submit" disabled={!!titleError} className="px-8 py-2 bg-primary text-white font-bold rounded-lg hover:bg-opacity-90 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">Save Product</button>
                    </div>
                </form>
            </div>
            
            {/* Render Modal OUTSIDE form to prevent nesting issues */}
            {contentModal.isOpen && (
                <AddContentModal 
                    onSave={handleContentSave} 
                    onClose={() => setContentModal({ isOpen: false, moduleId: null, file: null })} 
                    initialData={contentModal.file}
                />
            )}
        </div>
    );
};

const ProductManagement: React.FC<{ 
    products: ProductWithRating[]; 
    users: User[];
    coupons: Coupon[];
    onAddProduct: (product: Omit<Product, 'id'>) => void; 
    onUpdateProduct: (product: Product) => void; 
    onDeleteProduct: (id: number) => void; 
    settings: WebsiteSettings;
}> = ({ products, users, coupons, onAddProduct, onUpdateProduct, onDeleteProduct, settings }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [showEmailPreview, setShowEmailPreview] = useState<ProductWithRating | null>(null);

    const handleEdit = (product: ProductWithRating) => { setEditingProduct(product); setIsModalOpen(true); };
    const handleDelete = (id: number) => { if (window.confirm('Are you sure you want to delete this product?')) onDeleteProduct(id); };
    
    const handleSave = (productData: Product) => {
        try {
            if (editingProduct) {
                onUpdateProduct({ ...editingProduct, ...productData });
            } else {
                onAddProduct(productData);
                setTimeout(() => {
                    const mockNewProduct = { ...productData, id: Date.now(), rating: 0, reviewCount: 0, calculatedRating: 0 } as ProductWithRating;
                    setShowEmailPreview(mockNewProduct);
                }, 500);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving product:", error);
            alert("Failed to save product. The data might be too large for local storage (limit is ~5MB).");
        }
    };

    return (
        <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800">Product Inventory</h1>
                    <p className="text-slate-500 mt-1">Manage your digital products and courses.</p>
                </div>
                <button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-indigo-700 transition-all hover:-translate-y-0.5 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Product
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {products.map(product => (
                    <div key={product.id} className="bg-white rounded-xl p-5 shadow-md border border-slate-100 flex flex-col sm:flex-row gap-6 items-start sm:items-center hover:shadow-lg transition-shadow">
                        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                            <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-slate-800 truncate" title={product.title}>{product.title}</h3>
                            <p className="text-sm text-slate-500 mb-1">{product.category} • {product.sku}</p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="font-bold text-slate-900">{product.price}</span>
                                {product.salePrice && (
                                    <span className="text-sm text-slate-500 line-through">{product.salePrice}</span>
                                )}
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${product.inStock ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                                </span>
                                {!product.isVisible && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">Hidden</span>}
                            </div>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto justify-end">
                            <button onClick={() => setShowEmailPreview(product)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors" title="Preview Announcement Email">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </button>
                            <button onClick={() => handleEdit(product)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors font-medium">Edit</button>
                            <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors font-medium">Delete</button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && <ProductFormModal product={editingProduct} onSave={handleSave} onClose={() => setIsModalOpen(false)} availableCoupons={coupons} settings={settings} />}
            {showEmailPreview && <NewProductEmailPreviewModal product={showEmailPreview} relatedProducts={products.slice(0, 3)} users={users} onClose={() => setShowEmailPreview(null)} />}
        </div>
    );
};

export default ProductManagement;
