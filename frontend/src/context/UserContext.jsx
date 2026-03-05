import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    // Try to load user from localStorage if exists
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('userSettings');
        return savedUser ? JSON.parse(savedUser) : {
            name: 'Alex Smith',
            username: 'alexsmith',
            email: 'alex@example.com',
            avatar: ''
        };
    });

    // Keep localStorage sync'ed with state
    useEffect(() => {
        localStorage.setItem('userSettings', JSON.stringify(user));
    }, [user]);

    const updateUser = (newUserInfo) => {
        setUser((prev) => ({ ...prev, ...newUserInfo }));
    };

    return (
        <UserContext.Provider value={{ user, updateUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    return useContext(UserContext);
};
