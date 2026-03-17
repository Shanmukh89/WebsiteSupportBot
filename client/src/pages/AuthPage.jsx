import React, { useEffect } from 'react';
import { AuroraRibbon } from '../components/AuroraRibbon';
import AuthForm from '../components/AuthForm';
import './AuthPage.css';

export default function AuthPage() {
    useEffect(() => {
        document.title = 'Login | Site2Support';
    }, []);

    return (
        <div className="dt-modal-auth-backdrop">
            {/* Aurora Light Ribbon Animation */}
            <AuroraRibbon />

            {/* Centered Modal */}
            <div className="dt-modal-auth-wrapper">
                <AuthForm />
            </div>
        </div>
    );
}
