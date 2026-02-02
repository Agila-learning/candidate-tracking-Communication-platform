const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/candidates', require('./routes/candidateRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));

// Serve static assets in production
// Basic route
app.get('/', (req, res) => {
    res.send('FIC Banking Chat Forum API is running...');
});

// Socket.IO Logic
io.on('connection', (socket) => {
    socket.on('join_room', (room) => {
        socket.join(room);
    });

    socket.on('send_message', (data) => {
        // data: { room, senderId, text, attachments }
        io.to(data.room).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
    });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fic_banking';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Database connection error:', err);
    });
