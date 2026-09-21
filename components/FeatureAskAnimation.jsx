import React, { useState, useEffect } from 'react';
import '../pages/LandingPage.css';

export const FeatureAskAnimation = () => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Step 0: Empty chat
        // Step 1: Typing message
        // Step 2: Full message sent
        // Step 3: Bot starts typing

        let timeouts = [];
        const runSequence = () => {
            setStep(0);
            timeouts.push(setTimeout(() => setStep(1), 500));  // Start typing
            timeouts.push(setTimeout(() => setStep(2), 2000)); // Message sent
            timeouts.push(setTimeout(() => setStep(3), 2800)); // Bot typing response
            timeouts.push(setTimeout(runSequence, 4500));      // Loop
        };

        runSequence();
        return () => timeouts.forEach(clearTimeout);
    }, []);

    return (
        <div className="feature-anim-container">
            <div className="dt-mockup-frame feature-mockup">
                <div className="dt-mockup-content justify-end">

                    {step >= 1 && (
                        <div className="chat-bubble user slide-up-subtle">
                            {step === 1 ? (
                                <span className="typing-text-cursor">Do you have blue denim jeans in size M?</span>
                            ) : (
                                "Do you have blue denim jeans in size M?"
                            )}
                        </div>
                    )}

                    {step >= 3 && (
                        <div className="chat-bubble bot mt-8 fade-in">
                            <div className="typing-dots"><span>.</span><span>.</span><span>.</span></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
