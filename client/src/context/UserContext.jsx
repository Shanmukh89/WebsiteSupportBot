import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const { user: authUser } = useAuth();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch profile from Supabase whenever authUser changes
    useEffect(() => {
        let isMounted = true;

        async function fetchProfile() {
            if (!authUser) {
                if (isMounted) {
                    setUser(null);
                    setIsLoading(false);
                }
                return;
            }

            try {
                // Fetch the linked profile row
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching profile:', error.message);
                }

                if (isMounted) {
                    if (data) {
                        setUser({
                            id: data.id,
                            name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
                            first_name: data.first_name,
                            last_name: data.last_name,
                            username: data.first_name ? data.first_name.toLowerCase() : '',
                            email: data.email,
                            avatar: data.avatar_url || ''
                        });
                    } else {
                        // Fallback if trigger hasn't fired yet
                        setUser({
                            id: authUser.id,
                            name: authUser.user_metadata?.first_name || 'User',
                            first_name: authUser.user_metadata?.first_name || '',
                            last_name: authUser.user_metadata?.last_name || '',
                            username: 'user',
                            email: authUser.email,
                            avatar: ''
                        });
                    }
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Unexpected error fetching profile:", err);
                if (isMounted) setIsLoading(false);
            }
        }

        fetchProfile();

        return () => {
            isMounted = false;
        };
    }, [authUser]);

    // Update profile in Supabase
    const updateUser = async (newUserInfo) => {
        if (!authUser) return;

        // Optimistic UI update
        setUser((prev) => ({ ...prev, ...newUserInfo }));

        // Map frontend fields to database schema
        const updates = {};
        if (newUserInfo.name !== undefined) {
            const parts = newUserInfo.name.split(' ');
            updates.first_name = parts[0];
            updates.last_name = parts.slice(1).join(' ');
        }
        if (newUserInfo.avatar !== undefined) updates.avatar_url = newUserInfo.avatar;

        if (Object.keys(updates).length > 0) {
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', authUser.id);

            if (error) {
                console.error("Failed to update profile in Supabase:", error);
            }
        }
    };

    return (
        <UserContext.Provider value={{ user, updateUser, isLoading }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    return useContext(UserContext);
};
