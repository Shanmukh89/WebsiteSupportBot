import React, { useState, useRef } from 'react';
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
import './KnowledgeBaseView.css';

export default function KnowledgeBaseView({ agent, onUpdateKnowledge }) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    if (!agent || !agent.knowledge) {
        return (
            <div className="dt-kb-empty-state">
                <Loader2 className="spinner mb-4 text-dt-muted" size={24} />
                <p className="text-dt-muted">Select an agent to view knowledge base</p>
            </div>
        );
    }

    const { pages = [], files = [], lastIndexed } = agent.knowledge;

    const handleDeletePage = (pageId) => {
        if (confirm("Are you sure you want to remove this page from the knowledge base?")) {
            onUpdateKnowledge(agent.id, prev => ({
                ...prev,
                pages: (prev.pages || []).filter(p => p.id !== pageId)
            }));
        }
    };

    const handleDeleteFile = (fileId) => {
        if (confirm("Are you sure you want to delete this file?")) {
            onUpdateKnowledge(agent.id, prev => ({
                ...prev,
                files: (prev.files || []).filter(f => f.id !== fileId)
            }));
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

    const processNewFiles = (newFiles) => {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const processingIds = [];
        const newFileObjects = [];

        newFiles.forEach(file => {
            const ext = file.name.split('.').pop().toUpperCase();
            const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
            processingIds.push(id);

            newFileObjects.unshift({
                id,
                name: file.name,
                type: ext || 'FILE',
                status: 'Processing',
                uploaded: 'Just now'
            });
        });

        onUpdateKnowledge(agent.id, prevKnowledge => ({
            ...prevKnowledge,
            files: [...newFileObjects, ...(prevKnowledge.files || [])],
            lastIndexed: 'Indexing...'
        }));

        // Simulate processing delay
        setTimeout(() => {
            onUpdateKnowledge(agent.id, prevKnowledge => {
                const refreshedFiles = (prevKnowledge.files || []).map(f =>
                    processingIds.includes(f.id) ? { ...f, status: 'Indexed' } : f
                );
                return {
                    ...prevKnowledge,
                    files: refreshedFiles,
                    lastIndexed: 'Just now'
                };
            });
        }, 3000);
    };

    return (
        <div className="dt-kb-container">
            {/* Header / Summary Panel */}
            <header className="dt-kb-header">
                <div className="dt-kb-header-title">
                    <h2>Knowledge Base</h2>
                    <div className="dt-kb-badge">
                        <CheckCircle2 size={14} className="text-green-400" />
                        <span>Ready</span>
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
                            <span className="dt-kb-summary-val">{lastIndexed || 'Never'}</span>
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
                                            <div className="dt-kb-item-title">{page.title}</div>
                                            <a href={page.url} target="_blank" rel="noreferrer" className="dt-kb-item-url">{page.url}</a>
                                        </div>
                                        <div className="dt-kb-item-status">
                                            {page.status === 'Indexed' ? (
                                                <span className="dt-kb-status-badge success">Indexed</span>
                                            ) : (
                                                <span className="dt-kb-status-badge processing"><Loader2 size={12} className="spinner" /> Processing</span>
                                            )}
                                        </div>
                                        <div className="dt-kb-item-date">{page.updated}</div>
                                        <button className="dt-kb-icon-btn hover-red" onClick={() => handleDeletePage(page.id)}>
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
                                            <div className="dt-kb-item-title">{file.name}</div>
                                            <div className="dt-kb-item-url">{file.type} File</div>
                                        </div>
                                        <div className="dt-kb-item-status">
                                            {file.status === 'Indexed' ? (
                                                <span className="dt-kb-status-badge success">Indexed</span>
                                            ) : (
                                                <span className="dt-kb-status-badge processing"><Loader2 size={12} className="spinner" /> Processing</span>
                                            )}
                                        </div>
                                        <div className="dt-kb-item-date">{file.uploaded}</div>
                                        <button className="dt-kb-icon-btn hover-red" onClick={() => handleDeleteFile(file.id)} disabled={file.status === 'Processing'}>
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
