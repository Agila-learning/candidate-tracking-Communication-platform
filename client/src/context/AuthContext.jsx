import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { config } from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const res = await axios.get(config.endpoints.auth.me);
            setUser(res.data);
        } catch (e) {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
        } finally {
            setLoading(false);
        }
    };

    const login = async (identifier, password) => {
        // specific check for phone vs email
        const isEmail = identifier.includes('@');
        const payload = isEmail ? { email: identifier, password } : { phone: identifier, password };
        const res = await axios.post(config.endpoints.auth.login, payload);
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data.user);
        return res.data.user;
    };

    const signup = async (userData) => {
        const res = await axios.post(config.endpoints.auth.signup, userData);
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data.user);
        return res.data;
    };

    const sendOtp = async (phone) => {
        const res = await axios.post(config.endpoints.auth.sendOtp, { phone });
        return res.data;
    };

    const verifyOtp = async (phone, otp) => {
        const res = await axios.post(config.endpoints.auth.verifyOtp, { phone, otp });
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data.user);
        return res.data.user;
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, sendOtp, verifyOtp, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
