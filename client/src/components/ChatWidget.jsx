import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import './ChatWidget.css';

export default function ChatWidget({ isDemo = false, storeUrl = '' }) {
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'bot',
            text: isDemo
                ? 'Hello! How can I help you today?'
                : `Agent connected to ${storeUrl || 'your store'}. How can I help?`,
        },
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const newMsg = { id: Date.now(), sender: 'user', text: inputValue };
        setMessages((prev) => [...prev, newMsg]);
        setInputValue('');
        setIsTyping(true);

        // Mock bot response
        setTimeout(() => {
            let botResponse = "I'm sorry, I don't have information about that based on the store's knowledge base.";
            const lowerInput = newMsg.text.toLowerCase();

            if (lowerInput.includes('shipping') || lowerInput.includes('ship')) {
                botResponse = 'We ship internationally to over 50 countries. Shipping rates are calculated at checkout. Standard domestic shipping takes 3-5 business days.';
            } else if (lowerInput.includes('return') || lowerInput.includes('refund')) {
                botResponse = 'Our return policy lasts 30 days. To be eligible for a return, your item must be unused and in the same condition that you received it.';
            } else if (lowerInput.includes('hi') || lowerInput.includes('hello')) {
                botResponse = 'Hello! Feel free to ask me anything about our products, shipping, or policies.';
            }

            setMessages((prev) => [
                ...prev,
                { id: Date.now() + 1, sender: 'bot', text: botResponse },
            ]);
            setIsTyping(false);
        }, 1200);
    };

    return (
        <div className="chat-widget">
            <div className="chat-header">
                <Bot size={20} className="text-primary" />
                <div>
                    <h4 className="font-semibold text-body">Support Agent</h4>
                    <span className="text-label text-success">Online</span>
                </div>
            </div>

            <div className="chat-messages">
                {messages.map((msg) => (
                    <div key={msg.id} className={`message-row ${msg.sender}`}>
                        <div className={`message-avatar ${msg.sender}`}>
                            {msg.sender === 'bot' ? <Bot size={16} /> : <User size={16} />}
                        </div>
                        <div className={`message-bubble ${msg.sender}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="message-row bot">
                        <div className="message-avatar bot">
                            <Bot size={16} />
                        </div>
                        <div className="message-bubble typing">
                            <span className="dot"></span>
                            <span className="dot"></span>
                            <span className="dot"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="chat-input-area">
                <Input
                    placeholder="Type your question..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="chat-input"
                />
                <Button variant="primary" type="submit" className="send-btn" aria-label="Send message">
                    <Send size={18} />
                </Button>
            </form>
        </div>
    );
}
