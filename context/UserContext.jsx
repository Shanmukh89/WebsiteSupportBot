import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const { data: session, status } = useSession();
    const [user, setUser] = useState(null);
    const isLoading = status === 'loading';

    useEffect(() => {
        if (session?.user) {
            setUser({
                id: session.user.id,
                name: session.user.name || 'User',
                email: session.user.email,
                avatar: session.user.image || '',
                username: session.user.name ? session.user.name.split(' ')[0].toLowerCase() : 'user'
            });
        } else {
            setUser(null);
        }
    }, [session]);

    const updateUser = async (newUserInfo) => {
        if (!session?.user) return;
        
        // Optimistic UI update
        setUser((prev) => ({ ...prev, ...newUserInfo }));

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUserInfo)
            });
            if (!res.ok) {
                console.error("Failed to update profile via API");
            }
        } catch (error) {
            console.error("Failed to update profile:", error);
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
