import React from 'react';
import './ui.css';

export function Card({ children, className = '', ...props }) {
    return (
        <div className={`card ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className = '', ...props }) {
    return (
        <h3 className={`card-title ${className}`} {...props}>
            {children}
        </h3>
    );
}

export function CardDescription({ children, className = '', ...props }) {
    return (
        <p className={`card-description ${className}`} {...props}>
            {children}
        </p>
    );
}
