import React, { useState } from 'react';
import { Globe, Loader2, CheckCircle2, MessageSquare, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardTitle, CardDescription } from '../components/ui/Card';
import ChatWidget from '../components/ChatWidget';
import './Dashboard.css';

export default function Dashboard() {
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState('idle'); // idle, ingesting, done
    const [progress, setProgress] = useState(0);

    const handleIngest = (e) => {
        e.preventDefault();
        if (!url) return;
        setStatus('ingesting');
        setProgress(0);

        // Mock ingestion process
        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    setStatus('done');
                    return 100;
                }
                return p + 20;
            });
        }, 800);
    };

    return (
        <div className="dashboard-container">
            {/* Sidebar Layout */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <MessageSquare size={24} className="text-primary" />
                    <span className="font-semibold">Site2Agent</span>
                </div>
                <nav className="sidebar-nav">
                    <a href="#" className="active">Agents</a>
                    <a href="#">Knowledge Base</a>
                    <a href="#">Conversations</a>
                    <a href="#">Settings</a>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="content-header">
                    <h1 className="text-section">New Agent Setup</h1>
                    <p className="text-body text-secondary">Connect your website to generate an AI support assistant.</p>
                </header>

                <div className="content-body">
                    <Card className="ingestion-card">
                        <CardTitle>Website Knowledge Ingestion</CardTitle>
                        <CardDescription className="mb-24">
                            Enter your store URL. We will crawl the public pages, policies, and products to build your autonomous agent.
                        </CardDescription>

                        {status === 'idle' && (
                            <form onSubmit={handleIngest} className="ingestion-form">
                                <div className="input-group">
                                    <Globe className="input-icon text-muted" size={20} />
                                    <Input
                                        placeholder="https://yourstore.com"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        type="url"
                                        required
                                    />
                                </div>
                                <Button variant="primary" type="submit">Start Ingestion</Button>
                            </form>
                        )}

                        {status === 'ingesting' && (
                            <div className="ingesting-state">
                                <Loader2 className="spinner text-primary" size={32} />
                                <h3 className="font-semibold text-lg">Scanning Website...</h3>
                                <p className="text-secondary text-sm">Crawling pages and embedding knowledge.</p>
                                <div className="progress-bar-container mt-16">
                                    <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        )}

                        {status === 'done' && (
                            <div className="success-state">
                                <CheckCircle2 className="text-success mb-16" size={48} />
                                <h3 className="font-semibold text-lg">Agent Ready!</h3>
                                <p className="text-secondary text-sm">Your vector database has been populated successfully.</p>
                                <div className="success-actions mt-24">
                                    <Button variant="secondary" onClick={() => setStatus('idle')}>Add Another Source</Button>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Preview Section */}
                    <div className="preview-section mt-48">
                        <h2 className="text-card-title mb-16">Test Your Agent</h2>
                        <div className="preview-container">
                            {status === 'done' ? (
                                <ChatWidget isDemo={false} storeUrl={url} />
                            ) : (
                                <div className="empty-preview">
                                    <p className="text-secondary text-sm">Complete ingestion to test your agent here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
