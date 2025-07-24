import { useState, useRef, DragEvent, ChangeEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';
import { LuTrash } from "react-icons/lu";
import { AiOutlineInbox } from "react-icons/ai";
import HomeLayout from '../layouts/HomeLayout';
import Button from '../components/ui/Button';
import GoBackButton from '../components/ui/GoBackButton';

interface FileWithHeadlines {
    id: string;
    file: File;
    preview: string;
    text: string;
    headlines: string[];
}

const BulkUploadPage = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<FileWithHeadlines[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cleanup object URLs when component unmounts
    useEffect(() => {
        return () => {
            files.forEach(file => URL.revokeObjectURL(file.preview));
        };
    }, [files]);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        addFiles(selectedFiles);
    };

    const addFiles = (newFiles: File[]) => {
        const validFiles = newFiles.filter(file => 
            file.type.startsWith('image/') || 
            file.type.startsWith('video/') ||
            file.type === 'application/pdf'
        );

        const newFileItems: FileWithHeadlines[] = validFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: URL.createObjectURL(file),
            text: '',
            headlines: ['', '', '', '', '']
        }));

        setFiles(prev => [...prev, ...newFileItems]);
    };

    const removeFile = (id: string) => {
        setFiles(prev => {
            const fileToRemove = prev.find(f => f.id === id);
            if (fileToRemove) {
                URL.revokeObjectURL(fileToRemove.preview);
            }
            return prev.filter(f => f.id !== id);
        });
    };

    const updateText = (id: string, text: string) => {
        setFiles(prev => prev.map(f => 
            f.id === id ? { ...f, text } : f
        ));
    };

    const updateHeadline = (id: string, index: number, headline: string) => {
        setFiles(prev => prev.map(f => 
            f.id === id ? { 
                ...f, 
                headlines: f.headlines.map((h, i) => i === index ? headline : h)
            } : f
        ));
    };

    const addHeadline = (id: string) => {
        setFiles(prev => prev.map(f => 
            f.id === id ? { 
                ...f, 
                headlines: [...f.headlines, '']
            } : f
        ));
    };

    const removeHeadline = (id: string, index: number) => {
        setFiles(prev => prev.map(f => 
            f.id === id ? { 
                ...f, 
                headlines: f.headlines.filter((_, i) => i !== index)
            } : f
        ));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Create tasks for each file
            const tasks = files.map(file => ({
                id: Math.random().toString(36).substr(2, 9),
                item: file.file.name,
                preview: file.preview,
                taskStatus: 'New' as const,
                vertical: 'General',
                language: 'English',
                landingPageLanguage: 'English',
                creatives: '1',
                text: file.text,
                headline: file.headlines[0] || '',
                videoImage: file.file.name,
                submissionDateTime: new Date().toISOString()
            }));

            console.log('Created tasks:', tasks);
            
            // Navigate back to the table
            navigate('/creative-maker');
        } catch (error) {
            console.error('Error submitting files:', error);
        } finally {
            setIsSubmitting(false);
        }
    };



    return (
        <HomeLayout>
            <div className="p-6 bg-white min-h-screen">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-4">Bulk Upload</h1>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center justify-between mb-6">
                    <GoBackButton text="Creative Maker" path="/creative-maker" />
                </div>

                <div className="space-y-6">
                {/* Upload Area */}
                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors bg-gray-50 cursor-pointer ${
                        isDragOver 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <AiOutlineInbox className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Click or drag file to this area to upload
                    </h3>
                    <p className="mx-[370px] text-gray-600">
                        Support for a single or bulk upload. Strictly prohibit from uploading company data or other band files
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*,.pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>

                {/* Files List */}
                {files.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">
                            Files ({files.length})
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {files.map((file) => (
                                <div key={file.id} className="rounded-lg p-4 relative bg-white">
                                    {/* Trash Button - Upper Right Corner */}
                                    <Button
                                        onClick={() => removeFile(file.id)}
                                        className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 p-2 z-10 w-[30px] h-[30px]"
                                    >
                                        <LuTrash className="w-4 h-4" />
                                    </Button>
                                    
                                    <div className="flex items-start gap-4">
                                        {/* File Preview */}
                                        <div className="flex-shrink-0">
                                            {file.file.type.startsWith('image/') ? (
                                                <img
                                                    src={file.preview}
                                                    alt={file.file.name}
                                                    className="w-20 h-20 object-cover rounded-md"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center">
                                                    <span className="text-gray-500 text-xs text-center">
                                                        {file.file.type.startsWith('video/') ? 'VIDEO' : 'PDF'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* File Details */}
                                        <div className="flex-1 space-y-4">
                                            {/* Headlines */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Headlines
                                                    </label>
                                                    {file.headlines.length < 5 && (
                                                        <Button
                                                            onClick={() => addHeadline(file.id)}
                                                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                                                        >
                                                            <FaPlus className="w-3 h-3" />
                                                            Add Headline
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    {file.headlines.map((headline, index) => (
                                                        <div key={index} className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={headline}
                                                                onChange={(e) => updateHeadline(file.id, index, e.target.value)}
                                                                placeholder={`Headline ${index + 1}`}
                                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Text Input */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Text
                                                </label>
                                                <textarea
                                                    value={file.text}
                                                    onChange={(e) => updateText(file.id, e.target.value)}
                                                    placeholder="Enter text..."
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    rows={3}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                </div>
                {files.length > 0 && (
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="fixed bottom-4 right-8 border border-gray-300 bg-white text-black flex items-center justify-center gap-2 w-[120px] h-[32px] rounded-[4px] p-2 shadow-lg font-normal text-base hover:bg-gray-400 z-50"
                    >
                        {isSubmitting ? 'Saving...' : 'Save All'}
                    </Button>
                )}
            </div>
        </HomeLayout>
    );
};

export default BulkUploadPage; 