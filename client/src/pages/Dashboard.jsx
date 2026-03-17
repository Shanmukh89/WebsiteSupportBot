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
import ReactMarkdown from 'react-markdown';
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
    useEffect(() => {
        document.title = 'Dashboard | Site2Support';
    }, []);

    const navigate = useNavigate();
    const { user, isLoading: isUserLoading } = useUser();
    const { agents, setAgents, addAgent } = useAgents();
    const [activeAgentId, setActiveAgentId] = useState(null);
    const [urlInput, setUrlInput] = useState('');
    const [chatInput, setChatInput] = useState('');

    // UI Interaction States
    const [typingStates, setTypingStates] = useState({});
    const [isCreating, setIsCreating] = useState(false);
    const [scrapeStep, setScrapeStep] = useState(0);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isRescraping, setIsRescraping] = useState({});
    const [activeTab, setActiveTab] = useState('agents'); // 'agents' | 'knowledge'

    // Local chat messages keyed by agentId – persisted to localStorage
    const [chatMessages, setChatMessages] = useState(() => {
        try {
            const saved = localStorage.getItem('chatMessages');
            return saved ? JSON.parse(saved) : {};
        } catch { return {}; }
    });

    // Persist chat messages whenever they change
    useEffect(() => {
        localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
    }, [chatMessages]);

    // Helper to get messages for a specific agent
    const getAgentMessages = (agentId) => {
        if (!agentId) return [];
        return chatMessages[agentId] || [];
    };

    // Helper to set messages for a specific agent
    const setAgentMessages = (agentId, updater) => {
        setChatMessages(prev => ({
            ...prev,
            [agentId]: typeof updater === 'function' ? updater(prev[agentId] || []) : updater
        }));
    };

    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const activeAgent = agents.find(a => a.id === activeAgentId);
    const activeMessages = getAgentMessages(activeAgentId);

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
    }, [activeMessages, typingStates[activeAgentId], activeAgentId]);

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

    const handleCreateAgent = async () => {
        if (!urlInput.trim()) return;
        setIsCreating(true);
        setScrapeStep(0);

        let currentStep = 0;
        // Stagger the steps to simulate real progress
        const interval = setInterval(() => {
            currentStep++;
            // Don't reach the final step until the actual API call finishes
            if (currentStep < SCRAPE_STEPS.length - 1) {
                setScrapeStep(currentStep);
            }
        }, 5000); // 5 seconds per step

        const storeName = getStoreNameFromUrl(urlInput);

        // Insert agent into Supabase (also creates the initial knowledge_source)
        const newAgent = await addAgent({
            name: storeName,
            url: urlInput,
            messages: [
                {
                    id: 1,
                    text: `Hello! I'm the AI assistant for ${storeName}. How can I help you today?`,
                    role: 'assistant'
                }
            ],
        });

        if (newAgent) {
            setActiveAgentId(newAgent.id);
            setUrlInput('');

            // Set the initial welcome message
            setAgentMessages(newAgent.id, [{
                id: Date.now(),
                text: `Hello! I'm the AI assistant for ${storeName}. How can I help you today?`,
                role: 'assistant'
            }]);

            // Trigger background scraping job
            try {
                await fetch(`${import.meta.env.VITE_API_URL}/api/agents/scrape`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        agentId: newAgent.id,
                        url: urlInput
                    })
                });
            } catch (err) {
                console.error("Failed to start background scrape:", err);
            }
        }

        // Clean up the fake step interval once the fetch completes
        // The overlay will now be driven by activeAgent.status === 'scraping'
        setScrapeStep(SCRAPE_STEPS.length - 1);
        clearInterval(interval);
        setIsCreating(false);
    };

    // Knowledge logic now handled by KnowledgeBaseView + AgentContext directly

    // -------- Chat Logic --------
    const handleSendMessage = (e) => {
        if (e) e.preventDefault();
        if (!chatInput.trim()) return;

        const userMsg = {
            id: Date.now(),
            text: chatInput.trim(),
            role: 'user'
        };

        setAgentMessages(activeAgentId, prev => [...prev, userMsg]);

        setChatInput('');
        streamAIResponse(activeAgentId, userMsg.text);
    };

    const streamAIResponse = async (targetAgentId, messageText) => {
        setTypingStates(prev => ({ ...prev, [targetAgentId]: true }));

        // Find existing history to send as context
        const history = getAgentMessages(targetAgentId);

        // Create a placeholder message with a guaranteed unique ID
        const placeholderId = Date.now() + 1;
        const initialAiMsg = {
            id: placeholderId,
            text: "",
            role: 'assistant'
        };

        setAgentMessages(targetAgentId, prev => [...prev, initialAiMsg]);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId: targetAgentId,
                    message: messageText,
                    history: history.slice(-5)
                })
            });

            if (!response.ok) throw new Error('API Error');
            if (!response.body) throw new Error('No body returned from API');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            setTypingStates(prev => ({ ...prev, [targetAgentId]: false }));

            let fullText = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunkString = decoder.decode(value, { stream: true });
                // Split on actual newline pairs (SSE format)
                const lines = chunkString.split('\n\n').filter(line => line.trim());

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6);
                        if (dataStr === '[DONE]') break;

                        try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed.text) {
                                fullText += parsed.text;
                                setAgentMessages(targetAgentId, prev =>
                                    prev.map(m =>
                                        m.id === placeholderId ? { ...m, text: fullText } : m
                                    )
                                );
                            }
                        } catch (e) {
                            console.error("Error parsing stream chunk:", e, dataStr);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Streaming chat error:", error);
            setAgentMessages(targetAgentId, prev =>
                prev.map(m =>
                    m.id === placeholderId
                        ? { ...m, text: "Sorry, I encountered an error connecting to my knowledge base. Please ensure the backend server is running." }
                        : m
                )
            );
            setTypingStates(prev => ({ ...prev, [targetAgentId]: false }));
        }
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

        setAgentMessages(activeAgentId, prev => [...prev, uploadingMsg]);

        // Simulate upload delay
        setTimeout(() => {
            setAgentMessages(activeAgentId, prev =>
                prev.map(m => m.id === tempId ? { ...m, isUploading: false } : m)
            );

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
                setAgentMessages(activeAgentId, prev => [...prev, aiMsg]);
                setTypingStates(prev => ({ ...prev, [activeAgentId]: false }));
            }, 1500);

        }, 1200);

        e.target.value = ''; // Reset input so same file can be uploaded again if needed
    };

    const handleRescrape = async () => {
        setIsRescraping(prev => ({ ...prev, [activeAgentId]: true }));

        const indexingMsg = {
            id: Date.now(),
            text: "Re-indexing website content... This may take a minute.",
            role: 'system_uploading'
        };

        setAgentMessages(activeAgentId, prev => [...prev, indexingMsg]);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/agents/scrape`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId: activeAgentId,
                    url: activeAgent.url
                })
            });

            if (!response.ok) throw new Error('Failed to rescrape');
            
            const result = await response.json();

            const successMsg = {
                id: Date.now() + 1,
                text: `Knowledge base updated successfully.`,
                role: 'system'
            };
            const welcomeMsg = {
                id: Date.now() + 2,
                text: `Hello! I'm the AI assistant for ${activeAgent.name}. I've just been updated with the latest information!`,
                role: 'assistant'
            };

            setAgentMessages(activeAgentId, prev => [...prev, successMsg, welcomeMsg]);
        } catch (error) {
            console.error("Failed to rescrape:", error);
            const errorMsg = {
                id: Date.now() + 1,
                text: "Failed to update knowledge base. Please try again.",
                role: 'system'
            };
            setAgentMessages(activeAgentId, prev => [...prev, errorMsg]);
        } finally {
            setIsRescraping(prev => ({ ...prev, [activeAgentId]: false }));
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    // Guard: wait for user profile to load before rendering
    if (isUserLoading || !user) {
        return (
            <div className="dt-dash-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={32} className="spinner" style={{ color: 'var(--dt-accent-blue)' }} />
            </div>
        );
    }

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
                            disabled={isCreating}
                        />
                    </div>
                    <Button
                        variant="solid"
                        className="dt-dash-create-btn"
                        onClick={handleCreateAgent}
                        disabled={isCreating || !urlInput.trim()}
                    >
                        {isCreating ? 'Scraping...' : 'Create Agent'}
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
                                    {activeAgent?.status === 'scraping' && (
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
                                        {activeMessages.map((msg) => (
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
                                                    <div className={`dt-dash-chat-bubble ${msg.role === 'user' ? 'user' : 'bot'} ${msg.role === 'assistant' ? 'markdown-body' : ''}`}>
                                                        {msg.role === 'assistant' ? (
                                                            <ReactMarkdown
                                                                components={{
                                                                    a: ({ href, children }) => (
                                                                        <a
                                                                            href={href}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            style={{ color: '#6C8EF5', textDecoration: 'underline', cursor: 'pointer' }}
                                                                        >
                                                                            {children}
                                                                        </a>
                                                                    ),
                                                                    p: ({ children }) => <p style={{ margin: '4px 0' }}>{children}</p>,
                                                                    ul: ({ children }) => <ul style={{ paddingLeft: '16px', margin: '4px 0' }}>{children}</ul>,
                                                                    li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
                                                                    strong: ({ children }) => <strong style={{ color: '#ffffff' }}>{children}</strong>,
                                                                }}
                                                            >
                                                                {msg.text}
                                                            </ReactMarkdown>
                                                        ) : (
                                                            msg.text
                                                        )}
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
                                        placeholder={activeAgent?.status === 'scraping' ? "Scraping in progress..." : "Ask your agent a question..."}
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        disabled={isRescraping[activeAgentId] || activeAgent?.status === 'scraping'}
                                    />
                                    <button
                                        className="dt-dash-icon-btn hover-brightness"
                                        onClick={handleSendMessage}
                                        disabled={!chatInput.trim() || isRescraping[activeAgentId] || activeAgent?.status === 'scraping'}
                                        type="button"
                                        style={{
                                            color: 'var(--chat-primary, var(--dt-accent-blue))',
                                            background: 'transparent',
                                            border: 'none',
                                            padding: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: (!chatInput.trim() || isRescraping[activeAgentId] || activeAgent?.status === 'scraping') ? 0.5 : 1,
                                            cursor: (!chatInput.trim() || isRescraping[activeAgentId] || activeAgent?.status === 'scraping') ? 'not-allowed' : 'pointer'
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
