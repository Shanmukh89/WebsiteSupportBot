import React, { createContext, useContext, useState, useEffect } from 'react';

const AgentContext = createContext();

const COLORS = [
    'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'
];

const DEFAULT_AGENTS = [
    {
        id: '1',
        name: 'TechGadgets Store',
        url: 'https://techgadgets.com',
        online: true,
        color: COLORS[0],
        messages: [
            { id: 1, text: "Hello! I am the support agent for TechGadgets. Need help with an order?", role: 'assistant' }
        ],
        knowledge: {
            pages: [
                { id: '1', title: 'Home Page', url: 'https://techgadgets.com', status: 'Indexed', updated: '2 hrs ago' },
                { id: '2', title: 'Shipping Policy', url: 'https://techgadgets.com/shipping', status: 'Indexed', updated: '2 hrs ago' }
            ],
            files: [
                { id: 'f1', name: 'product-catalog-2023.pdf', type: 'PDF', status: 'Indexed', uploaded: 'Yesterday' }
            ],
            lastIndexed: '2 hrs ago'
        }
    },
    {
        id: '2',
        name: 'SneakerZone',
        url: 'https://sneakerzone.io',
        online: true,
        color: COLORS[1],
        messages: [
            { id: 1, text: "Hello! I am the support agent for SneakerZone. How can I help you today?", role: 'assistant' },
            { id: 2, text: "Do you ship internationally?", role: 'user' },
            { id: 3, text: "Yes, we ship to over 100 countries worldwide. International shipping typically takes 5-10 business days depending on the destination. Is there a specific country you're looking to ship to?", role: 'assistant' }
        ],
        knowledge: {
            pages: [
                { id: '3', title: 'Home Page', url: 'https://sneakerzone.io', status: 'Indexed', updated: '1 day ago' },
                { id: '4', title: 'FAQ', url: 'https://sneakerzone.io/faq', status: 'Indexed', updated: '1 day ago' },
                { id: '5', title: 'New Arrivals', url: 'https://sneakerzone.io/new', status: 'Processing', updated: 'Just now' }
            ],
            files: [],
            lastIndexed: '1 day ago'
        }
    },
    {
        id: '3',
        name: 'Organic Beauty',
        url: 'https://organicbeauty.co',
        online: true,
        color: COLORS[2],
        messages: [
            { id: 1, text: "Welcome to Organic Beauty support! Are you looking for product recommendations?", role: 'assistant' }
        ],
        knowledge: {
            pages: [
                { id: '6', title: 'Home Page', url: 'https://organicbeauty.co', status: 'Indexed', updated: '5 days ago' }
            ],
            files: [],
            lastIndexed: '5 days ago'
        }
    }
];

export function AgentProvider({ children }) {
    const [agents, setAgents] = useState(() => {
        const savedAgents = localStorage.getItem('site2support_agents');
        return savedAgents ? JSON.parse(savedAgents) : DEFAULT_AGENTS;
    });

    useEffect(() => {
        localStorage.setItem('site2support_agents', JSON.stringify(agents));
    }, [agents]);

    const clearKnowledgeBase = () => {
        setAgents(prevAgents => prevAgents.map(agent => ({
            ...agent,
            knowledge: {
                pages: [],
                files: [],
                lastIndexed: null
            }
        })));
    };

    const clearAllData = () => {
        setAgents([]);
        localStorage.removeItem('site2support_agents');
    };

    return (
        <AgentContext.Provider value={{ agents, setAgents, clearKnowledgeBase, clearAllData }}>
            {children}
        </AgentContext.Provider>
    );
}

export function useAgents() {
    return useContext(AgentContext);
}
