import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import HomeLayout from '../layouts/HomeLayout';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import { tspidService } from '../services/tspidService';
import { TSPID } from '../types/types';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

const EditTSPID: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        tspid_value: '',
        enabled: true,
        generationMethod: 'manual' as 'manual' | 'auto' | 'partner_feed',
        expiryDays: 30
    });
    const [errors, setErrors] = useState<{[key: string]: boolean}>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const GENERATION_METHODS = [
        { value: 'manual', label: 'Manual' },
        { value: 'auto', label: 'Auto' },
        { value: 'partner_feed', label: 'Partner Feed' }
    ];

    useEffect(() => {
        const fetchTSPID = async () => {
            if (!id) return;
            
            try {
                setIsLoading(true);
                setError(null);
                
                const tspid = await tspidService.get(id);
                setFormData({
                    tspid_value: tspid.tspid_value,
                    enabled: tspid.enabled,
                    generationMethod: tspid.generationMethod,
                    expiryDays: tspid.expiryDays
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch TSPID configuration');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTSPID();
    }, [id]);

    const handleInputChange = (field: string, value: string | boolean | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: false
            }));
        }
    };

    const validateForm = () => {
        const newErrors: {[key: string]: boolean} = {};
        
        if (!formData.tspid_value.trim()) {
            newErrors.tspid_value = true;
        }
        
        if (!formData.expiryDays || formData.expiryDays <= 0) {
            newErrors.expiryDays = true;
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm() || !id) {
            return;
        }

        try {
            setIsSubmitting(true);
            
            await tspidService.update({
                id: id,
                tspid_value: formData.tspid_value.trim(),
                enabled: formData.enabled,
                generationMethod: formData.generationMethod,
                expiryDays: formData.expiryDays
            });

            navigate('/tspid');
            
        } catch (error) {
            console.error('Failed to update TSPID config:', error);
            alert('Failed to update TSPID configuration. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <HomeLayout>
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
            </HomeLayout>
        );
    }

    if (error) {
        return (
            <HomeLayout>
                <div className="p-6">
                    <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                        {error}
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Button
                            onClick={() => navigate('/tspid')}
                            className="text-black hover:text-black flex items-center gap-2"
                        >
                            <FaArrowLeft />
                            Back
                        </Button>
                    </div>
                </div>
            </HomeLayout>
        );
    }

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
                    <h1 className="text-2xl font-bold px-4 py-2">Edit TSPID Configuration</h1>
                </div>

                <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-6">
                            {/* TSPID Value */}
                            <div>
                                <Input
                                    type="text"
                                    label="TSPID Value"
                                    placeholder="Enter TSPID value"
                                    value={formData.tspid_value}
                                    onChange={(e) => handleInputChange('tspid_value', e.target.value)}
                                    className={errors.tspid_value ? 'border-red-500' : ''}
                                />
                                {errors.tspid_value && (
                                    <p className="text-red-500 text-sm mt-1">TSPID value is required</p>
                                )}
                            </div>

                            {/* Enabled Status */}
                            <div>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.enabled}
                                        onChange={(e) => handleInputChange('enabled', e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Enabled</span>
                                </label>
                            </div>

                            {/* Generation Method */}
                            <div>
                                <Select
                                    id="generationMethod"
                                    label="Generation Method"
                                    options={GENERATION_METHODS}
                                    value={[formData.generationMethod]}
                                    onChange={(value) => handleInputChange('generationMethod', value[0] as 'manual' | 'auto' | 'partner_feed')}
                                    placeholder="Select generation method"
                                />
                            </div>

                            {/* Expiry Days */}
                            <div>
                                <Input
                                    type="number"
                                    label="Expiry Days"
                                    placeholder="30"
                                    value={formData.expiryDays.toString()}
                                    onChange={(e) => handleInputChange('expiryDays', parseInt(e.target.value) || 0)}
                                    className={errors.expiryDays ? 'border-red-500' : ''}
                                />
                                {errors.expiryDays && (
                                    <p className="text-red-500 text-sm mt-1">Expiry days must be greater than 0</p>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end mt-8">
                            <Button
                                type="submit"
                                className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                                disabled={isSubmitting}
                            >
                                <FaSave />
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </HomeLayout>
    );
};

export default EditTSPID; 