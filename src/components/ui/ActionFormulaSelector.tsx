import React, { useState, useEffect, useRef } from 'react';
import { actionsService, ActionFormula } from '../../services/actionsService';

interface ActionFormulaSelectorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

const ActionFormulaSelector: React.FC<ActionFormulaSelectorProps> = ({
    value,
    onChange,
    placeholder = "Enter or select formula",
    disabled = false,
    className = ""
}) => {
    const [actionFormulas, setActionFormulas] = useState<ActionFormula[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadActionFormulas();

        // Close dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadActionFormulas = async () => {
        try {
            setLoading(true);
            setError(null);
            const formulas = await actionsService.listActionFormulas();
            
            // Remove duplicates by formula text, keeping the latest version
            const uniqueFormulas = formulas
                .filter(f => f.status === 'ENABLED')
                .reduce((acc, current) => {
                    const existing = acc.find(f => f.formula === current.formula);
                    if (!existing || new Date(current.created_at) > new Date(existing.created_at)) {
                        if (existing) {
                            acc = acc.filter(f => f.formula !== current.formula);
                        }
                        acc.push(current);
                    }
                    return acc;
                }, [] as ActionFormula[]);

            setActionFormulas(uniqueFormulas);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load formulas');
            setActionFormulas([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (inputValue: string) => {
        onChange(inputValue);
    };

    const handleSelectFormula = (formula: string) => {
        onChange(formula);
        setShowDropdown(false);
    };

    const filteredFormulas = actionFormulas.filter(formula => 
        formula.formula.toLowerCase().includes((value || '').toLowerCase()) ||
        (formula.description || '').toLowerCase().includes((value || '').toLowerCase())
    );

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            {error && (
                <div className="text-red-500 text-xs mb-1">
                    {error}
                </div>
            )}
            
            <input
                type="text"
                value={value}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
            />

            {showDropdown && filteredFormulas.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredFormulas.map((formula, index) => (
                        <div
                            key={index}
                            className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => handleSelectFormula(formula.formula)}
                        >
                            <div className="text-sm font-mono">{formula.formula}</div>
                            {formula.description && (
                                <div className="text-xs text-gray-500 mt-1">{formula.description}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ActionFormulaSelector; 