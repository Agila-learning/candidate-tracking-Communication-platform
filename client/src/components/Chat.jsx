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

    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

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

    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            setRecordingTime(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = handleStopRecording;

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Could not access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            // Stop all tracks to release microphone
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleStopRecording = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Chrome/Firefox common format
        const audioFile = new File([audioBlob], 'voice_message.webm', { type: 'audio/webm' });

        await sendAudioMessage(audioFile);
    };

    const sendAudioMessage = async (file) => {
        const formData = new FormData();
        formData.append('audio', file);

        try {
            // 1. Upload Audio
            const uploadRes = await axios.post(`${config.endpoints.chat}/upload-audio`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const { url, name, public_id } = uploadRes.data;

            // 2. Send Message with Attachment
            const messageData = {
                conversationId,
                text: '🎤 Voice Message',
                attachments: [{
                    type: 'audio',
                    url: url,
                    public_id: public_id,
                    name: name
                }]
            };

            const res = await axios.post(`${config.endpoints.chat}/messages`, messageData);
            socketRef.current.emit('send_message', { ...res.data, room: conversationId });
        } catch (err) {
            console.error('Failed to send voice message:', err);
            alert('Failed to send voice message');
        }
    };

    const handleDelete = async (messageId) => {
        if (!confirm('Are you sure you want to delete this message?')) return;
        try {
            await axios.delete(`${config.endpoints.chat}/messages/${messageId}`);
            setMessages(prev => prev.filter(m => m._id !== messageId));
        } catch (err) {
            console.error('Failed to delete message:', err);
            alert('Failed to delete message');
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

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {messages.map((m, i) => {
                    const isMe = m.senderId?.toString() === user?._id?.toString();
                    const audioAttachment = m.attachments?.find(a => a.type === 'audio');

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
                            {audioAttachment ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.2rem' }}>🎤</span>
                                    <audio controls src={audioAttachment.url} style={{ height: '30px', maxWidth: '200px' }} />
                                </div>
                            ) : (
                                m.text
                            )}
                            <div style={{ fontSize: '0.65rem', marginTop: '0.25rem', opacity: 0.7, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {(isMe || user?.role === 'ADMIN') && (
                                    <button
                                        onClick={() => handleDelete(m._id)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'inherit',
                                            opacity: 0.7,
                                            cursor: 'pointer',
                                            padding: 0,
                                            fontSize: '0.8rem'
                                        }}
                                        title="Delete Message"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isRecording ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--danger)', fontWeight: 'bold' }}>
                        <div className="pulsate" style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--danger)' }}></div>
                        Recording {formatTime(recordingTime)}...
                        <button
                            type="button"
                            onClick={stopRecording}
                            style={{
                                marginLeft: 'auto',
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                fontSize: '1.2rem'
                            }}
                        >
                            ⏹️
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        <button
                            type="button"
                            onClick={startRecording}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                padding: '0 0.5rem'
                            }}
                            title="Record Voice Message"
                        >
                            🎙️
                        </button>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            style={{ flex: 1 }}
                        />
                        <button type="submit" className="primary">Send</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Chat;
