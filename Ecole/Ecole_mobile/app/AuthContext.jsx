import { createContext, useContext, useState, useEffect } from 'react';
import { storage } from './Storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [authData, setAuthData] = useState({ user: null, token: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStoredAuth();
    }, []);

    const loadStoredAuth = async () => {
        try {
            const token = await storage.getItem('token');
            const user = await storage.getItem('user');
            if (token && user) {
                setAuthData({
                    user: JSON.parse(user),
                    token: token
                });
            }
        } catch (error) {
            console.error('Error loading auth from storage:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (data) => {
        setAuthData(data);
        try {
            await storage.setItem('token', data.token);
            await storage.setItem('user', JSON.stringify(data.user));
        } catch (error) {
            console.error('Error saving auth to storage:', error);
        }
    };

    const logout = async () => {
        setAuthData({ user: null, token: null });
        try {
            await storage.removeItem('token');
            await storage.removeItem('user');
        } catch (error) {
            console.error('Error removing auth from storage:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ authData, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }
    return context;
};
