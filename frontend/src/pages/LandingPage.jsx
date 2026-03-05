import React from 'react';
import { Bot, ChevronRight, Lock, LayoutDashboard, LineChart, MoveRight, Layers, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import './LandingPage.css';
import { HexagonBackground } from '../components/animate-ui/components/backgrounds/hexagon';
import { HeroChatDemo } from '../components/HeroChatDemo';
import { FAQAccordion } from '../components/FAQAccordion';
import { FeatureConnectAnimation } from '../components/FeatureConnectAnimation';
import { FeatureAskAnimation } from '../components/FeatureAskAnimation';
import { FeatureAnswerAnimation } from '../components/FeatureAnswerAnimation';

export default function LandingPage({ onGetStarted }) {
    return (
        <div className="dt-landing-container">
            {/* Navigation */}
            <nav className="dt-nav-bar">
                <div className="nav-group-left">
                    <div className="dt-logo-pill">
                        <Bot size={20} className="text-white" />
                    </div>
                </div>
                <div className="nav-group-right">
                    <Button variant="dt-outline" className="btn-sm border-transparent" onClick={onGetStarted}>Log in</Button>
                    <Button variant="dt-solid" className="btn-sm" onClick={onGetStarted}>Create Agent</Button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="dt-hero-section" style={{ position: 'relative' }}>
                {/* Interactive Hexagon Background */}
                <HexagonBackground className="opacity-50" />

                <div className="dt-hero-content" style={{ position: 'relative', zIndex: 10 }}>
                    <h1 className="text-dt-hero text-white leading-tight mb-24">
                        Turn Any Store Into <br />
                        <span className="whitespace-nowrap">
                            Your Personal AI Assistant
                        </span>
                    </h1>
                    <p className="text-body text-dt-muted mb-48 max-w-md">
                        Site2Support's AI centralizes and analyzes your public pages to build an autonomous support agent, so your team can focus on growth.
                    </p>
                    <div className="dt-hero-actions">
                        <Button variant="dt-solid" onClick={onGetStarted}>
                            Create Agent
                        </Button>
                        <Button variant="dt-outline" onClick={onGetStarted}>
                            View Demo
                        </Button>
                    </div>
                </div>
                <div className="dt-hero-visual">
                    {/* Ambient Glows */}
                    <div className="glow glow-blue"></div>
                    <div className="glow glow-purple"></div>

                    <HeroChatDemo />
                </div>
            </section>

            {/* Social Proof / Logo Farm */}
            <section className="dt-social-proof">
                <div className="logofarm-header">
                    <h3 className="text-body font-medium text-white">Connecting the world's leading stores to their customers:</h3>
                    <div className="logofarm-ratings text-dt-mono text-dt-muted">
                        ★ 4.9 /5 G2 &nbsp;&nbsp;&nbsp; ★ 4.8 /5 CAPTERRA
                    </div>
                </div>
                <div className="dt-logos-marquee-wrapper">
                    <div className="dt-logos-marquee">
                        <img src="/logos/Amazon.png" alt="Amazon" className="dt-brand-logo" />
                        <img src="/logos/H&M.png" alt="H&M" className="dt-brand-logo" />
                        <img src="/logos/Snitch.png" alt="Snitch" className="dt-brand-logo" />
                        <img src="/logos/Souled Store.png" alt="Souled Store" className="dt-brand-logo" />
                        <img src="/logos/Zara.png" alt="Zara" className="dt-brand-logo" />
                    </div>
                    <div className="dt-logos-marquee" aria-hidden="true">
                        <img src="/logos/Amazon.png" alt="Amazon" className="dt-brand-logo" />
                        <img src="/logos/H&M.png" alt="H&M" className="dt-brand-logo" />
                        <img src="/logos/Snitch.png" alt="Snitch" className="dt-brand-logo" />
                        <img src="/logos/Souled Store.png" alt="Souled Store" className="dt-brand-logo" />
                        <img src="/logos/Zara.png" alt="Zara" className="dt-brand-logo" />
                    </div>
                </div>

                <div className="dt-how-it-works mt-128">
                    <span className="text-dt-mono text-dt-muted mb-24 block">How it works</span>
                    <h2 className="text-dt-section text-white max-w-lg">
                        Site2Support turns your website pages into an intelligent agent, driving customer satisfaction and revenue.
                    </h2>
                </div>
            </section>

            {/* Metrics / ROI Section */}
            <section className="dt-metrics-section">
                <div className="dt-metric-card">
                    <span className="dt-metric-value text-white">2.3x</span>
                    <span className="dt-metric-label text-white font-medium mb-8">Return on investment</span>
                    <span className="text-sm text-dt-muted">See more than double your ROI, with payback in under six months.</span>
                </div>
                <div className="dt-metric-card">
                    <span className="dt-metric-value text-white">30hrs</span>
                    <span className="dt-metric-label text-white font-medium mb-8">Weekly time saved</span>
                    <span className="text-sm text-dt-muted">Reclaim almost a full workweek with autonomous support.</span>
                </div>
                <div className="dt-metric-card">
                    <span className="dt-metric-value text-white">70%</span>
                    <span className="dt-metric-label text-white font-medium mb-8">Automated resolution</span>
                    <span className="text-sm text-dt-muted">Deflect repetitive queries instantly without sacrificing quality.</span>
                </div>
            </section>

            {/* Feature Section 01: Ingest */}
            <section className="dt-feature-section pt-128">
                <div className="dt-feature-content">
                    <span className="text-dt-mono text-dt-accent mb-24 block">[01] CONNECT</span>
                    <h2 className="text-dt-section text-white mb-24">Build a knowledge base from anywhere</h2>
                    <p className="text-body text-dt-muted max-w-sm">
                        Paste a store URL and instantly activate its AI assistant.
                        We analyze the website so you can explore it through conversation.
                    </p>
                </div>
                <div className="dt-feature-visual">
                    <FeatureConnectAnimation />
                </div>
            </section>

            {/* Feature Section 02: Analyze */}
            <section className="dt-feature-section reverse pt-128 pb-128">
                <div className="dt-feature-content">
                    <span className="text-dt-mono text-dt-accent mb-24 block">[02] ASK</span>
                    <h2 className="text-dt-section text-white mb-24">Strictly grounded answers</h2>
                    <p className="text-body text-dt-muted max-w-sm">
                        Skip the search and ask your question directly.
                        The assistant finds the right information for you.
                    </p>
                </div>
                <div className="dt-feature-visual">
                    <FeatureAskAnimation />
                </div>
            </section>

            {/* Feature Section 03: Act */}
            <section className="dt-feature-section pt-128 pb-128 mb-96">
                <div className="dt-feature-content">
                    <span className="text-dt-mono text-dt-accent mb-24 block">[03] GET ANSWERS</span>
                    <h2 className="text-dt-section text-white mb-24">Autonomous 24/7 Support</h2>
                    <p className="text-body text-dt-muted max-w-sm">
                        Get fast, reliable answers when it matters most.
                        Shop smarter with complete clarity.
                    </p>
                </div>
                <div className="dt-feature-visual">
                    <FeatureAnswerAnimation />
                </div>
            </section>

            {/* FAQ Section */}
            <section className="dt-faq-section">
                <div className="text-center mb-64" style={{ marginBottom: '64px' }}>
                    <span className="text-dt-mono text-dt-muted mb-24 block">Questions & Answers</span>
                    <h2 className="text-dt-section text-white">Frequently Asked Questions</h2>
                </div>
                <FAQAccordion />
            </section>

            {/* ═══════════════════════════════════════════════════ */}
            {/* SaaS Footer */}
            {/* ═══════════════════════════════════════════════════ */}
            <footer className="dt-saas-footer">
                {/* 1. Hero CTA Section */}
                <div className="dt-saas-footer-hero">
                    <div className="dt-saas-footer-hero-left">
                        <h2 className="dt-saas-footer-headline">
                            Turn any store into<br />an AI-powered assistant
                        </h2>
                        <p className="dt-saas-footer-desc">
                            Site2Support's AI centralizes your public pages to build an autonomous support agent — so your team can focus on growth.
                        </p>
                        <button className="dt-saas-footer-cta" onClick={onGetStarted}>
                            Get started — it's free
                        </button>
                    </div>
                    <div className="dt-saas-footer-hero-right">
                        <img src="/footer-3d.png" alt="Abstract 3D visual" className="dt-saas-footer-3d" />
                    </div>
                </div>

                {/* 2. Divider */}
                <div className="dt-saas-footer-divider" />

                {/* 3. Social + Description Strip */}
                <div className="dt-saas-footer-social-strip">
                    <div className="dt-saas-footer-brand">
                        <div className="dt-saas-footer-logo">
                            <Bot size={20} />
                        </div>
                        <p className="dt-saas-footer-brand-desc">
                            Tools to support your growth — without sacrificing speed, quality, or security.
                        </p>
                    </div>
                    <div className="dt-saas-footer-social-icons">
                        <a href="#" aria-label="GitHub" className="dt-saas-social-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" /></svg>
                        </a>
                        <a href="#" aria-label="LinkedIn" className="dt-saas-social-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                        </a>
                        <a href="#" aria-label="X / Twitter" className="dt-saas-social-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        </a>
                        <a href="#" aria-label="Email" className="dt-saas-social-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                        </a>
                    </div>
                </div>

                {/* 4. Divider */}
                <div className="dt-saas-footer-divider" />

                {/* 5. 4-Column Link Grid */}
                <div className="dt-saas-footer-links-grid">
                    <div className="dt-saas-footer-link-col">
                        <span className="dt-saas-footer-col-title">Explore</span>
                        <a href="#" onClick={onGetStarted}>Dashboard</a>
                        <a href="#">Knowledge Base</a>
                        <a href="#">AI Agents</a>
                    </div>
                    <div className="dt-saas-footer-link-col">
                        <span className="dt-saas-footer-col-title">Resources</span>
                        <a href="#">Documentation</a>
                        <a href="#">API Reference</a>
                        <a href="#">Help Center</a>
                        <a href="#">Changelog</a>
                    </div>
                    <div className="dt-saas-footer-link-col">
                        <span className="dt-saas-footer-col-title">Community</span>
                        <a href="#">Discord</a>
                        <a href="#">Forum</a>
                        <a href="#">Customers</a>
                        <a href="#">Referral Program</a>
                    </div>
                    <div className="dt-saas-footer-link-col">
                        <span className="dt-saas-footer-col-title">Company</span>
                        <a href="#">About Us</a>
                        <a href="#">Careers</a>
                        <a href="#">Pricing</a>
                        <a href="#">Contact</a>
                    </div>
                </div>

                {/* 6. Divider */}
                <div className="dt-saas-footer-divider" />

                {/* 7. Bottom Legal Bar */}
                <div className="dt-saas-footer-legal">
                    <span className="dt-saas-footer-copyright">© 2026 Site2Support. All rights reserved.</span>
                    <div className="dt-saas-footer-legal-links">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
