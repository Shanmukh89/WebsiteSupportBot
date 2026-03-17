import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const AgentContext = createContext();

const COLORS = [
    'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'
];

export function AgentProvider({ children }) {
    const { user: authUser } = useAuth();
    const [agents, setAgents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch agents linked to the logged-in user
    useEffect(() => {
        let isMounted = true;

        async function fetchAgents() {
            if (!authUser) {
                if (isMounted) {
                    setAgents([]);
                    setIsLoading(false);
                }
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('agents')
                    .select('*')
                    .eq('user_id', authUser.id)
                    .order('created_at', { ascending: true });

                if (error) {
                    console.error('Error fetching agents:', error.message);
                }

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
    }, [authUser]);

    // -------- Polling for agent status --------
    useEffect(() => {
        let isMounted = true;
        let pollInterval;

        const checkScrapingAgents = async () => {
            if (!authUser) return;
            // Find agents currently scraping
            const scrapingAgents = agents.filter(a => a.status === 'scraping');
            if (scrapingAgents.length === 0) return;

            try {
                const { data, error } = await supabase
                    .from('agents')
                    .select('id, status')
                    .in('id', scrapingAgents.map(a => a.id));

                if (error) throw error;

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

        // Only run interval if there are actually scraping agents
        if (agents.some(a => a.status === 'scraping')) {
            pollInterval = setInterval(checkScrapingAgents, 3000);
        }

        return () => {
            isMounted = false;
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [agents, authUser]);

    // -------- Agent CRUD --------

    const addAgent = async (agentData) => {
        if (!authUser) return null;

        const color = COLORS[agents.length % COLORS.length];
        const insertPayload = {
            user_id: authUser.id,
            name: agentData.name,
            url: agentData.url,
            status: 'scraping', // BUG 1 FIX
            online: true,
            color,
            messages: agentData.messages || [],
        };

        const { data, error } = await supabase
            .from('agents')
            .insert([insertPayload])
            .select()
            .single();

        if (error) {
            console.error('Error creating agent:', error.message);
            return null;
        }

        // Also create the initial website knowledge source
        if (data && agentData.url) {
            await supabase.from('knowledge_sources').insert([{
                agent_id: data.id,
                source_type: 'website',
                title: 'Home Page',
                url: agentData.url,
                status: 'indexed',
            }]);
        }

        setAgents(prev => [...prev, data]);
        return data;
    };

    const deleteAgent = async (agentId) => {
        if (!authUser) return;
        setAgents(prev => prev.filter(a => a.id !== agentId));
        await supabase.from('agents').delete().eq('id', agentId);
    };

    const clearAllData = async () => {
        if (!authUser) return;
        setAgents([]);
        await supabase.from('agents').delete().eq('user_id', authUser.id);
    };

    // -------- Knowledge Source CRUD --------

    const fetchKnowledgeSources = async (agentId) => {
        const { data, error } = await supabase
            .from('knowledge_sources')
            .select('*')
            .eq('agent_id', agentId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching knowledge sources:', error.message);
            return [];
        }
        return data || [];
    };

    const addKnowledgeSource = async (agentId, source) => {
        const { data, error } = await supabase
            .from('knowledge_sources')
            .insert([{ agent_id: agentId, ...source }])
            .select()
            .single();

        if (error) {
            console.error('Error adding knowledge source:', error.message);
            return null;
        }
        return data;
    };

    const deleteKnowledgeSource = async (sourceId) => {
        const { error } = await supabase
            .from('knowledge_sources')
            .delete()
            .eq('id', sourceId);

        if (error) {
            console.error('Error deleting knowledge source:', error.message);
        }
    };

    const clearAllSources = async (agentId) => {
        const { error } = await supabase
            .from('knowledge_sources')
            .delete()
            .eq('agent_id', agentId);

        if (error) {
            console.error('Error clearing knowledge sources:', error.message);
        }
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
