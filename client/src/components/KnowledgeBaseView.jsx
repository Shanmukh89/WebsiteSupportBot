import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Globe,
    FileText,
    Trash2,
    UploadCloud,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Clock
} from 'lucide-react';
import { useAgents } from '../context/AgentContext';
import './KnowledgeBaseView.css';

export default function KnowledgeBaseView({ agent }) {
    const [isDragging, setIsDragging] = useState(false);
    const [sources, setSources] = useState([]);
    const [isLoadingSources, setIsLoadingSources] = useState(true);
    const fileInputRef = useRef(null);
    const { fetchKnowledgeSources, addKnowledgeSource, deleteKnowledgeSource } = useAgents();

    // Fetch knowledge sources from Supabase when agent changes
    useEffect(() => {
        let isMounted = true;

        async function loadSources() {
            if (!agent) {
                if (isMounted) {
                    setSources([]);
                    setIsLoadingSources(false);
                }
                return;
            }

            setIsLoadingSources(true);
            const data = await fetchKnowledgeSources(agent.id);
            if (isMounted) {
                setSources(data);
                setIsLoadingSources(false);
            }
        }

        loadSources();

        return () => { isMounted = false; };
    }, [agent?.id]);

    if (!agent) {
        return (
            <div className="dt-kb-empty-state">
                <Loader2 className="spinner mb-4 text-dt-muted" size={24} />
                <p className="text-dt-muted">Select an agent to view knowledge base</p>
            </div>
        );
    }

    // Derive pages (websites) and files from sources
    const pages = sources.filter(s => s.source_type === 'website' || s.source_type === 'documentation' || s.source_type === 'faq');
    const files = sources.filter(s => s.source_type === 'pdf' || s.source_type === 'file_upload');
    const lastIndexed = sources.length > 0
        ? new Date(Math.max(...sources.map(s => new Date(s.updated_at || s.created_at)))).toLocaleString()
        : 'Never';

    const handleDeleteSource = async (sourceId) => {
        if (confirm("Are you sure you want to remove this from the knowledge base?")) {
            await deleteKnowledgeSource(sourceId);
            setSources(prev => prev.filter(s => s.id !== sourceId));
        }
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processNewFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            processNewFiles(Array.from(e.target.files));
        }
        e.target.value = '';
    };

    const processNewFiles = async (newFiles) => {
        for (const file of newFiles) {
            const ext = file.name.split('.').pop().toUpperCase();
            const sourceType = ext === 'PDF' ? 'pdf' : 'file_upload';

            // Optimistic UI: add a "processing" entry
            const tempId = 'temp-' + Date.now() + Math.random().toString(36).substr(2, 5);
            const tempSource = {
                id: tempId,
                source_type: sourceType,
                title: file.name,
                file_name: file.name,
                mime_type: file.type,
                file_size: file.size,
                status: 'processing',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            setSources(prev => [tempSource, ...prev]);

            // Insert into Supabase
            const saved = await addKnowledgeSource(agent.id, {
                source_type: sourceType,
                title: file.name,
                file_name: file.name,
                mime_type: file.type,
                file_size: file.size,
                status: 'indexed',
            });

            // Replace temp entry with real data
            if (saved) {
                setSources(prev => prev.map(s => s.id === tempId ? saved : s));
            } else {
                // Mark as failed
                setSources(prev => prev.map(s => s.id === tempId ? { ...s, status: 'failed' } : s));
            }
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'indexed':
                return <span className="dt-kb-status-badge success">Indexed</span>;
            case 'processing':
                return <span className="dt-kb-status-badge processing"><Loader2 size={12} className="spinner" /> Processing</span>;
            case 'failed':
                return <span className="dt-kb-status-badge" style={{ color: '#ef4444' }}><AlertCircle size={12} /> Failed</span>;
            default:
                return <span className="dt-kb-status-badge processing"><Loader2 size={12} className="spinner" /> Pending</span>;
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return d.toLocaleDateString();
    };

    return (
        <div className="dt-kb-container">
            {/* Header / Summary Panel */}
            <header className="dt-kb-header">
                <div className="dt-kb-header-title">
                    <h2>Knowledge Base</h2>
                    <div className="dt-kb-badge">
                        {isLoadingSources ? (
                            <><Loader2 size={14} className="spinner" /><span>Loading</span></>
                        ) : (
                            <><CheckCircle2 size={14} className="text-green-400" /><span>Ready</span></>
                        )}
                    </div>
                </div>

                <div className="dt-kb-summary-cards">
                    <div className="dt-kb-summary-card">
                        <div className="dt-kb-summary-icon-wrap">
                            <Globe size={20} />
                        </div>
                        <div>
                            <span className="dt-kb-summary-val">{pages.length}</span>
                            <span className="dt-kb-summary-label">Pages Indexed</span>
                        </div>
                    </div>
                    <div className="dt-kb-summary-card">
                        <div className="dt-kb-summary-icon-wrap">
                            <FileText size={20} />
                        </div>
                        <div>
                            <span className="dt-kb-summary-val">{files.length}</span>
                            <span className="dt-kb-summary-label">Files Uploaded</span>
                        </div>
                    </div>
                    <div className="dt-kb-summary-card">
                        <div className="dt-kb-summary-icon-wrap">
                            <Clock size={20} />
                        </div>
                        <div>
                            <span className="dt-kb-summary-val">{lastIndexed}</span>
                            <span className="dt-kb-summary-label">Last Updated</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="dt-kb-content-scroll">
                {/* Indexed Pages Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="dt-kb-section"
                >
                    <div className="dt-kb-section-header-row">
                        <h3 className="dt-kb-section-title">Indexed Website Pages</h3>
                    </div>
                    {pages.length === 0 ? (
                        <div className="dt-kb-empty-list">No pages indexed yet.</div>
                    ) : (
                        <div className="dt-kb-list">
                            <AnimatePresence>
                                {pages.map(page => (
                                    <motion.div
                                        key={page.id}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                        className="dt-kb-list-item"
                                    >
                                        <div className="dt-kb-item-icon">
                                            <Globe size={18} />
                                        </div>
                                        <div className="dt-kb-item-info">
                                            <div className="dt-kb-item-title">{page.title || page.url}</div>
                                            {page.url && <a href={page.url} target="_blank" rel="noreferrer" className="dt-kb-item-url">{page.url}</a>}
                                        </div>
                                        <div className="dt-kb-item-status">
                                            {getStatusBadge(page.status)}
                                        </div>
                                        <div className="dt-kb-item-date">{formatDate(page.updated_at || page.created_at)}</div>
                                        <button className="dt-kb-icon-btn hover-red" onClick={() => handleDeleteSource(page.id)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.section>

                {/* Uploaded Files Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="dt-kb-section"
                >
                    <div className="dt-kb-section-header-row">
                        <h3 className="dt-kb-section-title">Uploaded Files</h3>
                        <button className="dt-kb-upload-sm-btn" onClick={() => fileInputRef.current?.click()}>
                            <UploadCloud size={16} /> Upload File
                        </button>
                    </div>

                    {/* Drag and Drop Zone */}
                    <div
                        className={`dt-kb-dropzone ${isDragging ? 'dragging' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                        onDrop={handleFileDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="dt-kb-dropzone-inner">
                            <div className="dt-kb-dropzone-icon">
                                <UploadCloud size={32} />
                            </div>
                            <h4 className="dt-kb-dropzone-title">Click to upload or drag and drop</h4>
                            <p className="dt-kb-dropzone-subtitle">PDF, DOCX, TXT, or CSV (max. 10MB)</p>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileInput}
                            multiple
                            accept=".pdf,.doc,.docx,.txt,.csv"
                        />
                    </div>

                    {files.length > 0 && (
                        <div className="dt-kb-list mt-8">
                            <AnimatePresence>
                                {files.map(file => (
                                    <motion.div
                                        key={file.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="dt-kb-list-item"
                                    >
                                        <div className="dt-kb-item-icon file">
                                            <FileText size={18} />
                                        </div>
                                        <div className="dt-kb-item-info">
                                            <div className="dt-kb-item-title">{file.file_name || file.title}</div>
                                            <div className="dt-kb-item-url">{file.mime_type || 'File'}</div>
                                        </div>
                                        <div className="dt-kb-item-status">
                                            {getStatusBadge(file.status)}
                                        </div>
                                        <div className="dt-kb-item-date">{formatDate(file.updated_at || file.created_at)}</div>
                                        <button className="dt-kb-icon-btn hover-red" onClick={() => handleDeleteSource(file.id)} disabled={file.status === 'processing'}>
                                            <Trash2 size={18} />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.section>
            </div>
        </div>
    );
}
