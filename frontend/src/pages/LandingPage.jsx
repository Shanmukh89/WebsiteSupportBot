import React from 'react';
import { Bot, Zap, Shield, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardTitle, CardDescription } from '../components/ui/Card';
import './LandingPage.css';

export default function LandingPage({ onGetStarted }) {
    return (
        <div className="landing-container">
            {/* Navigation */}
            <nav className="nav-bar">
                <div className="logo">
                    <Bot size={24} className="text-primary" />
                    <span className="font-semibold text-lg">Site2Agent</span>
                </div>
                <div className="nav-links">
                    <a href="#features">Features</a>
                    <a href="#pricing">Pricing</a>
                    <Button variant="primary" onClick={onGetStarted}>Get Started</Button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="text-hero">Instant AI Support for Your Store</h1>
                    <p className="text-body text-secondary mb-32">
                        Transform your website content into a fully autonomous AI customer support agent in under 10 minutes. No configuration required.
                    </p>
                    <div className="hero-actions">
                        <Button variant="primary" onClick={onGetStarted}>
                            Create Agent <ChevronRight size={18} />
                        </Button>
                        <Button variant="secondary">View Demo</Button>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="mockup-window">
                        <div className="mockup-header">
                            <span className="dot" style={{ background: '#ff5f56' }}></span>
                            <span className="dot" style={{ background: '#ffbd2e' }}></span>
                            <span className="dot" style={{ background: '#27c93f' }}></span>
                        </div>
                        <div className="mockup-body">
                            <div className="chat-bubble bot">Hello! How can I help you today?</div>
                            <div className="chat-bubble user">Do you ship internationally?</div>
                            <div className="chat-bubble bot">Yes, we ship to over 50 countries globally. Shipping rates are calculated at checkout.</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust / Social Proof */}
            <section className="social-proof">
                <p className="text-metadata text-center text-muted">Trusted by innovative online stores</p>
                <div className="logos">
                    <div className="fake-logo">StoreFront</div>
                    <div className="fake-logo">ShopifyPlus</div>
                    <div className="fake-logo">Commerz</div>
                    <div className="fake-logo">BoutiqueCo</div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="features-header text-center">
                    <h2 className="text-section">Zero-Configuration Required</h2>
                    <p className="text-body text-secondary max-w-md mx-auto">
                        Site2Agent scans your website to build a knowledge base automatically, answering queries with 100% accuracy grounded in your policies.
                    </p>
                </div>

                <div className="features-grid">
                    <Card>
                        <div className="feature-icon"><Zap size={24} className="text-primary" /></div>
                        <CardTitle>Instant Ingestion</CardTitle>
                        <CardDescription>Just provide your store URL. We crawl your public pages and policies in minutes to build a semantic vector database.</CardDescription>
                    </Card>
                    <Card>
                        <div className="feature-icon"><Shield size={24} className="text-primary" /></div>
                        <CardTitle>Grounded Answers</CardTitle>
                        <CardDescription>Our LLM uses strict RAG to ensure it only answers using your website's content. Say goodbye to AI hallucinations.</CardDescription>
                    </Card>
                    <Card>
                        <div className="feature-icon"><Bot size={24} className="text-primary" /></div>
                        <CardTitle>Autonomous Support</CardTitle>
                        <CardDescription>Resolve up to 70% of repetitive questions about shipping, returns, and product details instantly, around the clock.</CardDescription>
                    </Card>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-col">
                        <div className="logo mb-16">
                            <Bot size={20} className="text-primary" />
                            <span className="font-semibold text-body">Site2Agent</span>
                        </div>
                        <p className="text-metadata text-secondary">Automated customer support for modern e-commerce.</p>
                    </div>
                    <div className="footer-col">
                        <h4 className="text-body font-semibold mb-16">Product</h4>
                        <a href="#">Features</a>
                        <a href="#">Pricing</a>
                        <a href="#">Integrations</a>
                    </div>
                    <div className="footer-col">
                        <h4 className="text-body font-semibold mb-16">Company</h4>
                        <a href="#">About</a>
                        <a href="#">Blog</a>
                        <a href="#">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
