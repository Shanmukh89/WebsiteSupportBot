import React, { useState, useEffect } from 'react';
import '../pages/LandingPage.css';

export const HeroChatDemo = () => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Animation Sequence (6-8s loop)
        // Step 0: Initializing knowledge base
        // Step 1: User typing indicator
        // Step 2: User message appears
        // Step 3: Bot typing indicator
        // Step 4: Bot message appears
        // Step 5: Fade out / Reset

        let timeouts = [];

        const runSequence = () => {
            setStep(0);
            timeouts.push(setTimeout(() => setStep(1), 1500)); // Show user typing
            timeouts.push(setTimeout(() => setStep(2), 2500)); // Show user message
            timeouts.push(setTimeout(() => setStep(3), 3200)); // Show bot typing
            timeouts.push(setTimeout(() => setStep(4), 4700)); // Show bot message
            timeouts.push(setTimeout(() => setStep(5), 7500)); // Fade out
            timeouts.push(setTimeout(runSequence, 8000));      // Loop
        };

        runSequence();

        return () => timeouts.forEach(clearTimeout);
    }, []);

    return (
        <div className={`dt-mockup-frame demo-step-${step}`}>
            <div className="dt-mockup-content">
                <div className="text-dt-mono text-dt-muted mb-16 fade-in text-center text-xs tracking-widest opacity-80 uppercase">
                    <span className="inline-block w-2 h-2 rounded-full bg-[var(--dt-accent-blue)] mr-2 animate-pulse"></span>
                    Connected to https://souledstore.com/
                </div>

                {step >= 1 && (
                    <div className="chat-bubble user slide-up">
                        {step === 1 ? (
                            <div className="typing-dots"><span>.</span><span>.</span><span>.</span></div>
                        ) : (
                            "Do you have blue denim jeans in size M?"
                        )}
                    </div>
                )}

                {step >= 3 && (
                    <div className="chat-bubble bot slide-up mt-2">
                        {step === 3 ? (
                            <div className="typing-dots"><span>.</span><span>.</span><span>.</span></div>
                        ) : (
                            <div>
                                Yes — Blue Denim Jeans are available in size M.<br />
                                <span className="opacity-70 mt-1 block">Delivery: 3–5 days.</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
