import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { config } from '../config';

const Chat = ({ conversationId }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const socketRef = useRef();
    const messagesEndRef = useRef();

    useEffect(() => {
        socketRef.current = io(config.apiUrl);
        socketRef.current.emit('join_room', conversationId);

        socketRef.current.on('receive_message', (message) => {
            setMessages((prev) => [...prev, message]);
        });

        fetchMessages();

        return () => socketRef.current.disconnect();
    }, [conversationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const res = await axios.get(`${config.endpoints.chat}/messages/${conversationId}`);
            setMessages(res.data);
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageData = {
            conversationId,
            text: newMessage
        };

        try {
            const res = await axios.post(`${config.endpoints.chat}/messages`, messageData);
            socketRef.current.emit('send_message', { ...res.data, room: conversationId });
            setNewMessage('');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {messages.map((m, i) => {
                    const isMe = m.senderId?.toString() === user?._id?.toString();
                    return (
                        <div key={i} style={{
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                            padding: '0.75rem 1rem',
                            borderRadius: '12px',
                            borderBottomRightRadius: isMe ? '2px' : '12px',
                            borderBottomLeftRadius: isMe ? '12px' : '2px',
                            backgroundColor: isMe ? 'var(--primary)' : 'var(--bg-main)',
                            color: isMe ? 'white' : 'var(--text-main)',
                            fontSize: '0.9rem',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            {m.text}
                            <div style={{ fontSize: '0.65rem', marginTop: '0.25rem', opacity: 0.7, textAlign: 'right' }}>
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', padding: '1rem', borderTop: '1px solid var(--border)' }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                />
                <button type="submit" className="primary">Send</button>
            </form>
        </div>
    );
};

export default Chat;
