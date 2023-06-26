const router = require('express').Router();
const bcrypt = require('bcrypt');
const dataValidation = require('../utils/dataValidation');
const security = require('../utils/security');
const User = require('../models/user');
const authMiddleware = require('../middleware/auth');
const ChatRoom = require('../models/chatRoom');

//Route để lấy danh sách tin nhắn trong phòng chat
router.get('/rooms/:roomId/messages', async (req, res) => {
    const roomId = req.params.roomId;

    try {
        const messages = await MongoDBService.getMessages(roomId);
        ChatRoom.findOne({ _id: roomId }).then((message) => {
            res.json(message);
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});
// Route để gửi yêu cầu tham gia phòng chat
router.post('/api/rooms/:roomId/join', async (req, res) => {
    const roomId = req.params.roomId;
    const userId = req.body.userId; // ID của người dùng muốn tham gia

    try {
        // Kiểm tra xem phòng chat có tồn tại không
        const room = await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Thực hiện xử lý yêu cầu tham gia phòng chat ở đây
        // Ví dụ: lưu thông tin người dùng vào danh sách tham gia phòng
        room.participants.push(userId);
        await room.save();

        res.json({ message: 'Join room successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to join room' });
    }
});
// lấy thông tin chi tiet cua tin nhan
router.get('/api/rooms/:roomId/messages/:messageId', async (req, res) => {
    const { roomId, messageId } = req.params;

    try {
        const room = await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.json(message);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch message' });
    }
});