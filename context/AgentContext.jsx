import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const AgentContext = createContext();

const COLORS = [
    'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'
];

export function AgentProvider({ children }) {
    const { data: session } = useSession();
    const [agents, setAgents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch agents linked to the logged-in user
    useEffect(() => {
        let isMounted = true;

        async function fetchAgents() {
            if (!session?.user) {
                if (isMounted) {
                    setAgents([]);
                    setIsLoading(false);
                }
                return;
            }

            try {
                const res = await fetch('/api/agents');
                if (!res.ok) throw new Error("Failed to fetch agents");
                const data = await res.json();

                if (isMounted) {
                    setAgents(data || []);
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Unexpected error fetching agents:", err);
                if (isMounted) setIsLoading(false);
            }
        }

        fetchAgents();

        return () => {
            isMounted = false;
        };
    }, [session]);

    // -------- Polling for agent status --------
    useEffect(() => {
        let isMounted = true;
        let pollInterval;

        const checkScrapingAgents = async () => {
            if (!session?.user) return;
            const scrapingAgents = agents.filter(a => a.status === 'scraping');
            if (scrapingAgents.length === 0) return;

            try {
                const res = await fetch('/api/agents');
                if (!res.ok) return;
                const data = await res.json();

                if (data && isMounted) {
                    let changed = false;
                    const updatedAgents = agents.map(agent => {
                        const dbMatch = data.find(d => d.id === agent.id);
                        if (dbMatch && dbMatch.status !== agent.status) {
                            changed = true;
                            return { ...agent, status: dbMatch.status };
                        }
                        return agent;
                    });

                    if (changed) {
                        setAgents(updatedAgents);
                    }
                }
            } catch (err) {
                console.error("Error polling agent status:", err);
            }
        };

        if (agents.some(a => a.status === 'scraping')) {
            pollInterval = setInterval(checkScrapingAgents, 3000);
        }

        return () => {
            isMounted = false;
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [agents, session]);

    // -------- Agent CRUD --------

    const addAgent = async (agentData) => {
        if (!session?.user) return null;

        try {
            const res = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(agentData)
            });
            if (!res.ok) throw new Error("Failed to create agent");
            
            const newAgent = await res.json();
            
            // Assign color in frontend
            newAgent.color = COLORS[agents.length % COLORS.length];

            setAgents(prev => [...prev, newAgent]);
            return newAgent;
        } catch (error) {
            console.error('Error creating agent:', error.message);
            return null;
        }
    };

    const deleteAgent = async (agentId) => {
        if (!session?.user) return;
        setAgents(prev => prev.filter(a => a.id !== agentId));
        await fetch(`/api/agents/${agentId}`, { method: 'DELETE' });
    };

    const clearAllData = async () => {
        if (!session?.user) return;
        setAgents([]);
        // Ideally call a bulk delete API endpoint here
    };

    // -------- Knowledge Source CRUD --------

    const fetchKnowledgeSources = async (agentId) => {
        // Now loaded together via API include
        const agent = agents.find(a => a.id === agentId);
        return agent?.knowledgeSources || [];
    };

    const addKnowledgeSource = async (agentId, source) => {
        // Implement when moving to specific API
        return null;
    };

    const deleteKnowledgeSource = async (sourceId) => {
        // Implement when moving to specific API
    };

    const clearAllSources = async (agentId) => {
        // Implement when moving to specific API
    };

    return (
        <AgentContext.Provider
            value={{
                agents,
                setAgents,
                addAgent,
                deleteAgent,
                clearAllData,
                fetchKnowledgeSources,
                addKnowledgeSource,
                deleteKnowledgeSource,
                clearAllSources,
                isLoading
            }}
        >
            {children}
        </AgentContext.Provider>
    );
}

export function useAgents() {
    return useContext(AgentContext);
}
