import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import '../pages/LandingPage.css'; // Reuse chat-bubble styles

export const FeatureConnectAnimation = () => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Step 0: Initial empty state
        // Step 1: URL Pasted
        // Step 2: Loading dots
        // Step 3: Success message

        let timeouts = [];

        const runSequence = () => {
            setStep(0);
            timeouts.push(setTimeout(() => setStep(1), 1000)); // Paste URL
            timeouts.push(setTimeout(() => setStep(2), 2000)); // Loading
            timeouts.push(setTimeout(() => setStep(3), 3500)); // Success
            timeouts.push(setTimeout(runSequence, 6500));      // Loop
        };

        runSequence();

        return () => timeouts.forEach(clearTimeout);
    }, []);

    return (
        <div className="feature-anim-container">
            <div className="dt-mockup-frame feature-mockup">
                <div className="dt-mockup-content">
                    {/* URL Input Simulation */}
                    <div className="feature-url-bar fade-in">
                        <span className="text-dt-muted mr-8">https://</span>
                        {step >= 1 ? (
                            <span className="text-white">souledstore.com</span>
                        ) : (
                            <span className="text-dt-muted opacity-50">Enter store URL...</span>
                        )}
                        {step >= 1 && <div className="cursor-blink"></div>}
                    </div>

                    {step >= 2 && step < 3 && (
                        <div className="chat-bubble bot mt-16 fade-in flex items-center gap-2">
                            <div className="typing-dots"><span>.</span><span>.</span><span>.</span></div>
                        </div>
                    )}

                    {step >= 3 && (
                        <div className="chat-bubble bot mt-16 slide-up-subtle feature-success-bubble">
                            <div className="flex items-start gap-12">
                                <CheckCircle2 size={18} className="text-dt-accent mt-2 flex-shrink-0" />
                                <div>
                                    <div className="font-medium text-white mb-4">Connected to souledstore.com</div>
                                    <div className="text-dt-muted text-sm">Store knowledge ready.</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
