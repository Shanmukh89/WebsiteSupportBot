import React, { useState, useRef, useEffect } from 'react';
import {
    LayoutDashboard,
    Bot,
    Book,
    Settings,
    User,
    MoreVertical,
    Link as LinkIcon,
    Paperclip,
    Send,
    RefreshCw,
    Loader2,
    LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import KnowledgeBaseView from '../components/KnowledgeBaseView';
import { useUser } from '../context/UserContext';
import { useAgents } from '../context/AgentContext';
import './Dashboard.css';

const SCRAPE_STEPS = [
    "Discovering pages...",
    "Extracting content...",
    "Building AI knowledge...",
    "Preparing assistant..."
];

export default function Dashboard() {
    const navigate = useNavigate();
    const { user } = useUser();
    const { agents, setAgents } = useAgents();
    const [activeAgentId, setActiveAgentId] = useState('2');
    const [urlInput, setUrlInput] = useState('');
    const [chatInput, setChatInput] = useState('');

    // UI Interaction States
    const [typingStates, setTypingStates] = useState({});
    const [isScraping, setIsScraping] = useState(false);
    const [scrapeStep, setScrapeStep] = useState(0);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isRescraping, setIsRescraping] = useState({});
    const [activeTab, setActiveTab] = useState('agents'); // 'agents' | 'knowledge'

    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const activeAgent = agents.find(a => a.id === activeAgentId);

    // Close profile menu if clicked outside or ESC key
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.dt-dash-user-section')) {
                setIsProfileMenuOpen(false);
            }
        };
        const handleEsc = (e) => {
            if (e.key === 'Escape') setIsProfileMenuOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, []);

    // Auto-scroll when messages update or typing state changes
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeAgent?.messages, typingStates[activeAgentId], activeAgentId]);

    // -------- Creation Logic --------
    const getStoreNameFromUrl = (urlStr) => {
        try {
            const domain = new URL(urlStr).hostname.replace('www.', '');
            const name = domain.split('.')[0];
            return name.charAt(0).toUpperCase() + name.slice(1);
        } catch {
            return "New Store";
        }
    };

    const handleCreateAgent = () => {
        if (!urlInput.trim()) return;
        setIsScraping(true);
        setScrapeStep(0);

        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            if (currentStep < SCRAPE_STEPS.length) {
                setScrapeStep(currentStep);
            }
        }, 800);

        setTimeout(() => {
            clearInterval(interval);

            const storeName = getStoreNameFromUrl(urlInput);
            const newAgentId = Date.now().toString();

            const newAgent = {
                id: newAgentId,
                name: storeName,
                url: urlInput,
                online: true,
                color: COLORS[agents.length % COLORS.length],
                messages: [
                    {
                        id: 1,
                        text: `Hello! I'm the AI assistant for ${storeName}. How can I help you today?`,
                        role: 'assistant'
                    }
                ],
                knowledge: {
                    pages: [{ id: Date.now().toString(), title: 'Home Page', url: urlInput, status: 'Indexed', updated: 'Just now' }],
                    files: [],
                    lastIndexed: 'Just now'
                }
            };

            setAgents(prev => [newAgent, ...prev]);
            setActiveAgentId(newAgentId);
            setIsScraping(false);
            setUrlInput('');
        }, 4000); // Wait slightly longer for effect
    };

    // -------- Knowledge Logic --------
    const handleUpdateKnowledge = (agentId, newKnowledge) => {
        setAgents(prev => prev.map(a => {
            if (a.id === agentId) {
                const resolvedKnowledge = typeof newKnowledge === 'function' ? newKnowledge(a.knowledge) : newKnowledge;
                return { ...a, knowledge: resolvedKnowledge };
            }
            return a;
        }));
    };

    // -------- Chat Logic --------
    const handleSendMessage = (e) => {
        if (e) e.preventDefault();
        if (!chatInput.trim()) return;

        const userMsg = {
            id: Date.now(),
            text: chatInput.trim(),
            role: 'user'
        };

        setAgents(prev => prev.map(a =>
            a.id === activeAgentId
                ? { ...a, messages: [...a.messages, userMsg] }
                : a
        ));

        setChatInput('');
        simulateAIResponse(activeAgentId);
    };

    const simulateAIResponse = (targetAgentId) => {
        setTypingStates(prev => ({ ...prev, [targetAgentId]: true }));

        setTimeout(() => {
            const aiMsg = {
                id: Date.now(),
                text: "Thanks! This is a simulated AI reply to your query.",
                role: 'assistant'
            };

            setAgents(prev => prev.map(a =>
                a.id === targetAgentId
                    ? { ...a, messages: [...a.messages, aiMsg] }
                    : a
            ));

            setTypingStates(prev => ({ ...prev, [targetAgentId]: false }));
        }, 1500);
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const isImage = file.type.startsWith('image/');
        const fileUrl = isImage ? URL.createObjectURL(file) : null;

        const tempId = Date.now();
        const uploadingMsg = {
            id: tempId,
            role: isImage ? 'user-image' : 'user-file',
            fileUrl,
            fileName: file.name,
            isUploading: true
        };

        setAgents(prev => prev.map(a =>
            a.id === activeAgentId
                ? { ...a, messages: [...a.messages, uploadingMsg] }
                : a
        ));

        // Simulate upload delay
        setTimeout(() => {
            setAgents(prev => prev.map(a => {
                if (a.id === activeAgentId) {
                    const msgs = a.messages.map(m => m.id === tempId ? { ...m, isUploading: false } : m);
                    return { ...a, messages: msgs };
                }
                return a;
            }));

            // Auto-respond to the file
            setTypingStates(prev => ({ ...prev, [activeAgentId]: true }));
            setTimeout(() => {
                const aiMsg = {
                    id: Date.now(),
                    text: isImage
                        ? `That looks like a great reference photo. Would you like similar products or availability details?`
                        : `I've received your file "${file.name}". How can I help you with this document?`,
                    role: 'assistant'
                };
                setAgents(prev => prev.map(a =>
                    a.id === activeAgentId
                        ? { ...a, messages: [...a.messages, aiMsg] }
                        : a
                ));
                setTypingStates(prev => ({ ...prev, [activeAgentId]: false }));
            }, 1500);

        }, 1200);

        e.target.value = ''; // Reset input so same file can be uploaded again if needed
    };

    const handleRescrape = () => {
        setIsRescraping(prev => ({ ...prev, [activeAgentId]: true }));

        const indexingMsg = {
            id: Date.now(),
            text: "Re-indexing website content...",
            role: 'system_uploading'
        };

        setAgents(prev => prev.map(a =>
            a.id === activeAgentId
                ? { ...a, messages: [...a.messages, indexingMsg] }
                : a
        ));

        setTimeout(() => {
            const successMsg = {
                id: Date.now() + 1,
                text: "Knowledge base updated successfully.",
                role: 'system'
            };
            const welcomeMsg = {
                id: Date.now() + 2,
                text: `Hello! I'm the AI assistant for ${activeAgent.name}. How can I help you today?`,
                role: 'assistant'
            };

            setAgents(prev => prev.map(a =>
                a.id === activeAgentId
                    ? { ...a, messages: [successMsg, welcomeMsg] }
                    : a
            ));

            setIsRescraping(prev => ({ ...prev, [activeAgentId]: false }));
        }, 3000);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <div className="dt-dash-layout">
            {/* 1. Left Sidebar */}
            <aside className="dt-dash-sidebar">
                <div className="dt-dash-logo">Site2Support</div>

                <nav className="dt-dash-nav">
                    <button
                        className={`dt-dash-nav-item ${activeTab === 'agents' ? 'active' : ''}`}
                        onClick={() => setActiveTab('agents')}
                    >
                        <Bot size={18} /> My Agents
                    </button>
                    <button
                        className={`dt-dash-nav-item ${activeTab === 'knowledge' ? 'active' : ''}`}
                        onClick={() => setActiveTab('knowledge')}
                    >
                        <Book size={18} /> Knowledge Base
                    </button>
                </nav>

                <div className="dt-dash-user-section" style={{ position: 'relative' }}>
                    <AnimatePresence>
                        {isProfileMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ duration: 0.15 }}
                                className="dt-dash-profile-menu"
                            >
                                <button className="dt-dash-profile-menu-item" onClick={() => navigate('/settings')}>
                                    <User size={16} /> Account Settings
                                </button>
                                <button className="dt-dash-profile-menu-item custom-hover-red" onClick={() => navigate('/')}>
                                    <LogOut size={16} /> Logout
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <button className="dt-dash-user-btn" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                        <div className="dt-dash-avatar" style={{ background: '#1E1E1E', overflow: 'hidden' }}>
                            {user.avatar ? (
                                <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <User size={16} className="text-white" />
                            )}
                        </div>
                        <div className="dt-dash-user-info">
                            <span className="dt-dash-user-name" style={{ textAlign: 'left' }}>{user.name || 'User'}</span>
                            <span className="dt-dash-user-role" style={{ textAlign: 'left' }}>@{user.username || 'user'}</span>
                        </div>
                        <MoreVertical size={16} className="text-dt-muted ml-auto" />
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="dt-dash-main">
                {/* 2. Top Creation Bar */}
                <header className="dt-dash-creation-bar">
                    <div className="dt-dash-creation-input-wrapper">
                        <LinkIcon className="dt-dash-input-icon text-dt-muted" size={18} />
                        <input
                            type="url"
                            className="dt-dash-creation-input"
                            placeholder="https://enter-store-url.com to scrape..."
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            disabled={isScraping}
                        />
                    </div>
                    <Button
                        variant="solid"
                        className="dt-dash-create-btn"
                        onClick={handleCreateAgent}
                        disabled={isScraping || !urlInput.trim()}
                    >
                        {isScraping ? 'Scraping...' : 'Create Agent'}
                    </Button>
                </header>

                {/* Split Context */}
                <div className="dt-dash-split-view">

                    {/* 3. Middle Column - Agent List */}
                    <section className="dt-dash-agent-list">
                        <h2 className="dt-dash-section-title">Your Agents</h2>
                        <div className="dt-dash-agents-container">
                            <AnimatePresence initial={false}>
                                {agents.map(agent => (
                                    <motion.button
                                        key={agent.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`dt-dash-agent-card ${activeAgentId === agent.id ? 'active' : ''}`}
                                        onClick={() => setActiveAgentId(agent.id)}
                                    >
                                        <div className="dt-dash-agent-avatar" style={{ background: agent.color }}>
                                        </div>
                                        <div className="dt-dash-agent-details">
                                            <span className="dt-dash-agent-name">{agent.name}</span>
                                            <span className="dt-dash-agent-url">{agent.url}</span>
                                        </div>
                                        {agent.online && <div className="dt-dash-status-dot"></div>}
                                    </motion.button>
                                ))}
                            </AnimatePresence>
                        </div>
                    </section>

                    {/* 4. Right Column - Active Chat Playground or Knowledge Base */}
                    {activeTab === 'knowledge' ? (
                        <KnowledgeBaseView
                            agent={activeAgent}
                            onUpdateKnowledge={handleUpdateKnowledge}
                        />
                    ) : (
                        <section className="dt-dash-playground">
                            <header className="dt-dash-playground-header">
                                <div className="dt-dash-pg-agent-info">
                                    <div className="dt-dash-agent-avatar" style={{ background: activeAgent?.color || '#333' }}></div>
                                    <div>
                                        <h3 className="dt-dash-pg-name">{activeAgent?.name || 'Select an Agent'}</h3>
                                        <div className="dt-dash-pg-status">
                                            <div className="dt-dash-status-dot"></div> Online & Ready
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="dt-dash-btn-secondary"
                                    onClick={handleRescrape}
                                    disabled={isRescraping[activeAgentId]}
                                >
                                    {isRescraping[activeAgentId] ? (
                                        <><Loader2 size={14} className="mr-8 spinner" /> Re-scraping...</>
                                    ) : (
                                        <><RefreshCw size={14} className="mr-8" /> Re-Scrape Data</>
                                    )}
                                </button>
                            </header>

                            <div className="dt-dash-chat-area" style={{ position: 'relative' }}>
                                {/* Scraping Loader Overlay */}
                                <AnimatePresence>
                                    {isScraping && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="dt-dash-scrape-overlay"
                                        >
                                            <div className="dt-dash-scrape-card">
                                                <Loader2 className="spinner text-[var(--dt-accent-blue)] mb-16" size={32} />
                                                <h3 className="text-lg font-semibold text-white mb-8">Connecting to store...</h3>
                                                <p className="text-dt-muted text-sm mb-24">Scraping website data and building knowledge base</p>

                                                <div className="dt-dash-scrape-steps">
                                                    {SCRAPE_STEPS.map((stepDesc, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`dt-dash-scrape-step ${idx <= scrapeStep ? 'active' : ''}`}
                                                        >
                                                            <div className="dt-dash-step-icon">
                                                                {idx < scrapeStep ? (
                                                                    <span className="text-[var(--dt-accent-blue)] font-bold">✓</span>
                                                                ) : idx === scrapeStep ? (
                                                                    <span className="spin-dot"></span>
                                                                ) : (
                                                                    <span className="text-dt-muted opacity-50">○</span>
                                                                )}
                                                            </div>
                                                            <span className={idx <= scrapeStep ? "text-white" : "text-dt-muted"}>{stepDesc}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="dt-dash-chat-messages">
                                    <AnimatePresence initial={false}>
                                        {activeAgent?.messages.map((msg) => (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{ duration: 0.2 }}
                                                className={`dt-dash-chat-bubble-wrapper ${msg.role.startsWith('user') ? 'user' : 'bot'}`}
                                            >
                                                {msg.role === 'user-image' && (
                                                    <div className={`dt-dash-chat-bubble user p-0 bg-transparent shadow-none border-none ${msg.isUploading ? 'opacity-50' : ''}`} style={{ padding: 0, background: 'transparent', boxShadow: 'none' }}>
                                                        <img src={msg.fileUrl} alt={msg.fileName} className="dt-dash-image-attachment" />
                                                        {msg.isUploading && (
                                                            <div className="dt-dash-sending-indicator text-dt-muted mt-8">
                                                                <Loader2 size={12} className="spinner" /> Sending...
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {msg.role === 'user-file' && (
                                                    <div className={`dt-dash-chat-bubble user ${msg.isUploading ? 'opacity-70' : ''}`}>
                                                        <div className="dt-dash-file-attachment-inner">
                                                            <Paperclip size={16} /> <span>{msg.fileName}</span>
                                                        </div>
                                                        {msg.isUploading && (
                                                            <div className="dt-dash-sending-indicator dt-dash-file-attachment-separator opacity-75">
                                                                <Loader2 size={12} className="spinner" /> Sending...
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {(msg.role === 'assistant' || msg.role === 'user') && (
                                                    <div className={`dt-dash-chat-bubble ${msg.role === 'user' ? 'user' : 'bot'}`}>
                                                        {msg.text}
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}

                                        {/* Typing Indicator */}
                                        {typingStates[activeAgentId] && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="dt-dash-chat-bubble-wrapper bot"
                                            >
                                                <div className="dt-dash-chat-bubble bot typing-indicator-container">
                                                    <span className="dot"></span>
                                                    <span className="dot"></span>
                                                    <span className="dot"></span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <div ref={chatEndRef} />
                                </div>

                                <div className="dt-dash-chat-input-bar">
                                    <button
                                        className="dt-dash-icon-btn text-dt-muted hover-brightness"
                                        onClick={triggerFileInput}
                                        title="Attach File"
                                        type="button"
                                    >
                                        <Paperclip size={18} />
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                    <input
                                        type="text"
                                        className="dt-dash-chat-input"
                                        placeholder="Ask your agent a question..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        disabled={isRescraping[activeAgentId]}
                                    />
                                    <button
                                        className="dt-dash-icon-btn hover-brightness"
                                        onClick={handleSendMessage}
                                        disabled={!chatInput.trim() || isRescraping[activeAgentId]}
                                        type="button"
                                        style={{
                                            color: 'var(--chat-primary, var(--dt-accent-blue))',
                                            background: 'transparent',
                                            border: 'none',
                                            padding: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: (!chatInput.trim() || isRescraping[activeAgentId]) ? 0.5 : 1,
                                            cursor: (!chatInput.trim() || isRescraping[activeAgentId]) ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}
