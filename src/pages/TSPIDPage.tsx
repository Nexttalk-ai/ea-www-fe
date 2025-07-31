import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactJson from 'react-json-view';
import Button from '../components/ui/Button';
import HomeLayout from '../layouts/HomeLayout';
import { FaArrowLeft, FaRedo, FaTimes, FaSave } from 'react-icons/fa';
import { tspidService } from '../services/tspidService';
import { TSPID } from '../types/types';

const TSPIDPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tspidConfig, setTspidConfig] = useState<TSPID | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [contentError, setContentError] = useState<string | null>(null);
    
    // JSON Editor Modal state
    const [showJsonEditor, setShowJsonEditor] = useState(false);
    const [jsonContent, setJsonContent] = useState('');
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const handleEditJson = () => {
        // Create a JSON representation of the current TSPID object
        const tspidObject = {
            id: tspidConfig?.id,
            revshare_coefficient: tspidConfig?.revshare_coefficient,
            organization_id: tspidConfig?.organization_id,
            created_at: tspidConfig?.created_at,
            updated_at: tspidConfig?.updated_at,
            deleted_at: tspidConfig?.deleted_at,
            version: tspidConfig?.version,
            status: tspidConfig?.status
        };
        setJsonContent(JSON.stringify(tspidObject, null, 2));
        setJsonError(null);
        setShowJsonEditor(true);
    };

    const validateJson = (jsonString: string): { isValid: boolean; parsed?: any; error?: string } => {
        try {
            const parsed = JSON.parse(jsonString);
            
            // Validate that it's a valid TSPID object
            if (typeof parsed !== 'object' || parsed === null) {
                return { isValid: false, error: 'Configuration must be a JSON object' };
            }
            
            // Validate required fields
            if (!parsed.id) {
                return { isValid: false, error: 'TSPID object must have an "id" field' };
            }
            
            if (!parsed.organization_id) {
                return { isValid: false, error: 'TSPID object must have an "organization_id" field' };
            }
            
            if (!parsed.status || !['ENABLED', 'DISABLED'].includes(parsed.status)) {
                return { isValid: false, error: 'TSPID object must have a "status" field with value "ENABLED" or "DISABLED"' };
            }
            
            return { isValid: true, parsed };
        } catch (e) {
            return { isValid: false, error: 'Invalid JSON format' };
        }
    };

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setJsonContent(newContent);
        
        if (newContent.trim()) {
            const validation = validateJson(newContent);
            setJsonError(validation.isValid ? null : validation.error || null);
        } else {
            setJsonError(null);
        }
    };

    const handleSaveJson = async () => {
        const validation = validateJson(jsonContent);
        if (!validation.isValid) {
            setJsonError(validation.error || null);
            return;
        }

        try {
            setSaving(true);
            setJsonError(null);

            await tspidService.update({
                id: tspidConfig!.id,
                organization_id: validation.parsed.organization_id,
                revshare_coefficient: validation.parsed.revshare_coefficient,
                status: validation.parsed.status
            });

            // Refresh the config data
            const updatedConfig = await tspidService.get(id!);
            setTspidConfig(updatedConfig);
            setShowJsonEditor(false);
        } catch (err) {
            setJsonError(err instanceof Error ? err.message : 'Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleCloseJsonEditor = () => {
        setShowJsonEditor(false);
        setJsonContent('');
        setJsonError(null);
    };

    useEffect(() => {
        const fetchTSPIDConfig = async () => {
            if (!id) return;
            
            try {
                setLoading(true);
                setError(null);
                setContentError(null);
                
                const config = await tspidService.get(id);
                setTspidConfig(config);
                setLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch TSPID configuration');
                setLoading(false);
            }
        };

        fetchTSPIDConfig();
    }, [id]);

    if (loading) {
        return (
            <HomeLayout>
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
            </HomeLayout>
        );
    }

    if (error || !tspidConfig) {
        return (
            <HomeLayout>
                <div className="p-6">
                    <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                        {error || 'TSPID configuration not found'}
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Button
                            onClick={() => navigate('/tspid')}
                            className="text-black hover:text-black flex items-center gap-2"
                        >
                            <FaArrowLeft />
                            Back
                        </Button>
                        {error && (
                            <Button
                                onClick={() => window.location.reload()}
                                className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                            >
                                <FaRedo />
                                Retry
                            </Button>
                        )}
                    </div>
                </div>
            </HomeLayout>
        );
    }

    // Extract configuration info from the actual data structure
    const configName = tspidConfig.id || 'Not set';
    const isEnabled = tspidConfig.status === 'ENABLED';
    const lastUpdated = tspidConfig.updated_at ? new Date(tspidConfig.updated_at).toLocaleString() : 'N/A';
    const revshareCoefficient = tspidConfig.revshare_coefficient !== null ? tspidConfig.revshare_coefficient : 'N/A';

    return (
        <HomeLayout>
            <div className="px-6 py-2">
                {/* Back Button */}
                <Button
                    onClick={() => navigate('/tspid')}
                    className="text-black hover:text-black flex items-center gap-2"
                >
                    <FaArrowLeft />
                    Back
                </Button>

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold px-4 py-2">TSPID Configuration: {configName}</h1>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => navigate(`/tspid/edit/${tspidConfig.id}`)}
                            className="bg-green-500 hover:bg-green-600 text-white whitespace-nowrap min-h-[40px] flex items-center justify-center"
                        >
                            Edit Config
                        </Button>
                        <Button
                            onClick={handleEditJson}
                            className="bg-blue-500 hover:bg-blue-600 text-white whitespace-nowrap min-h-[40px] flex items-center justify-center"
                        >
                            Edit JSON
                        </Button>
                    </div>
                </div>

                {/* Configuration Info */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">TSPID ID</h2>
                            <p className="mt-1 font-medium">{configName}</p>
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Organization ID</h2>
                            <p className="mt-1 font-medium">{tspidConfig.organization_id}</p>
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Status</h2>
                            <p className="mt-1">
                                <div className="flex items-center gap-2">
                                    <div 
                                        className={`w-2 h-2 rounded-full ${
                                        isEnabled ? 'bg-green-500' : 'bg-gray-400'
                                    }`}
                                />
                                    <span>{isEnabled ? 'Enabled' : 'Disabled'}</span>
                                </div>
                            </p>
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Revshare Coefficient</h2>
                            <p className="mt-1 font-medium">{revshareCoefficient}</p>
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Last Updated</h2>
                            <p className="mt-1">{lastUpdated}</p>
                        </div>
                    </div>
                </div>

                {/* JSON Configuration */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">TSPID Object JSON</h2>
                    
                    {contentError && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-yellow-800 text-sm">{contentError}</p>
                        </div>
                    )}
                    
                    <div className="bg-gray-50 rounded p-4" style={{ height: '500px', overflow: 'auto' }}>
                        <ReactJson
                            src={tspidConfig}
                            name={false}
                            theme="rjv-default"
                            enableClipboard={false}
                            displayDataTypes={false}
                            displayObjectSize={false}
                            quotesOnKeys={false}
                        />
                    </div>
                </div>

                {/* JSON Editor Modal */}
                {showJsonEditor && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl w-11/12 h-5/6 max-w-4xl flex flex-col">
                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-6 border-b">
                                <h2 className="text-xl font-bold">Edit TSPID Configuration</h2>
                                <button
                                    onClick={handleCloseJsonEditor}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <FaTimes className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 p-6 flex flex-col">
                                {jsonError && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                                        <p className="text-red-800 text-sm">
                                            <strong>JSON Error:</strong> {jsonError}
                                        </p>
                                    </div>
                                )}
                                
                                <div className="flex-1 flex flex-col">
                                    <label htmlFor="json-editor" className="block text-sm font-medium text-gray-700 mb-2">
                                        TSPID Configuration JSON:
                                    </label>
                                    <textarea
                                        id="json-editor"
                                        value={jsonContent}
                                        onChange={handleJsonChange}
                                        className={`flex-1 w-full p-4 border rounded-md font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            jsonError ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Enter valid TSPID configuration JSON..."
                                        spellCheck={false}
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end gap-3 p-6 border-t">
                                <Button
                                    onClick={handleCloseJsonEditor}
                                    className="bg-gray-500 hover:bg-gray-600 text-white"
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveJson}
                                    className={`text-white flex items-center gap-2 ${
                                        saving || jsonError 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : 'bg-green-500 hover:bg-green-600'
                                    }`}
                                    disabled={saving || !!jsonError}
                                >
                                    <FaSave />
                                    {saving ? 'Saving...' : 'Save Configuration'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </HomeLayout>
    );
};

export default TSPIDPage; 