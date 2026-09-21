import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './CustomSelect.css';

export default function CustomSelect({ options, value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (opt) => {
        onChange(opt);
        setIsOpen(false);
    };

    return (
        <div className="dt-custom-select-container" ref={containerRef}>
            <button
                type="button"
                className={`dt-custom-select-btn ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="dt-custom-select-value">{value}</span>
                <ChevronDown size={16} className={`dt-custom-select-arrow ${isOpen ? 'open' : ''}`} />
            </button>

            {isOpen && (
                <div className="dt-custom-select-dropdown">
                    {options.map((opt, i) => (
                        <button
                            key={i}
                            type="button"
                            className={`dt-custom-select-item ${value === opt ? 'selected' : ''}`}
                            onClick={() => handleSelect(opt)}
                        >
                            <span className="dt-custom-select-item-text">{opt}</span>
                            {value === opt && <Check size={14} className="dt-custom-select-check" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
