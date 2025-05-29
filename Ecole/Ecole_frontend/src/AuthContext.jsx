import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export default function AuthProvider  ({ children })  {
    const [authData, setAuthData] = useState(() => {
        // Optionnel: Récupérer depuis le localStorage pour maintenir la session
        const storedData = localStorage.getItem('authData');
        return storedData ? JSON.parse(storedData) : null;
    });

    const setAuth = (data) => {
        localStorage.setItem('authData', JSON.stringify(data));
        setAuthData(data);
    };

    const logout = () => {
        localStorage.removeItem('authData');
        setAuthData(null);
    };

    return (
        <AuthContext.Provider value={{ authData, setAuthData: setAuth, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);


