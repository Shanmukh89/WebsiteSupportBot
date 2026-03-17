import React, { useState, useEffect } from 'react';
import '../pages/LandingPage.css';

export const FeatureAnswerAnimation = () => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Step 0: User message exists, bot starts typing
        // Step 1: Bot response appears

        let timeouts = [];
        const runSequence = () => {
            setStep(0);
            timeouts.push(setTimeout(() => setStep(1), 1000)); // Bot responds
            timeouts.push(setTimeout(runSequence, 6000));      // Loop
        };

        runSequence();
        return () => timeouts.forEach(clearTimeout);
    }, []);

    return (
        <div className="feature-anim-container">
            <div className="dt-mockup-frame feature-mockup">
                <div className="dt-mockup-content justify-end">

                    <div className="chat-bubble user opacity-50 text-sm mb-8 slide-up-subtle" style={{ transform: step === 1 ? 'translateY(-10px)' : 'translateY(0)', transition: 'transform 0.5s ease' }}>
                        Do you have blue denim jeans in size M?
                    </div>

                    <div className="chat-bubble bot shadow-glow fade-in slide-up-subtle" style={{ minHeight: '80px' }}>
                        {step === 0 ? (
                            <div className="typing-dots mt-2"><span>.</span><span>.</span><span>.</span></div>
                        ) : (
                            <div className="fade-in">
                                Yes — Blue Denim Jeans are available in <strong className="text-white">size M</strong>.<br /><br />
                                <span className="text-dt-muted text-sm block">Estimated delivery: <strong className="text-white">3–5 business days</strong>.</span>
                                <span className="text-dt-muted text-sm block">Free returns within 7 days.</span>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};
