import React from 'react';
import './ui.css';

export function Input({ className = '', ...props }) {
    return (
        <input
            className={`input ${className}`}
            {...props}
        />
    );
}
