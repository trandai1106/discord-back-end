const router = require('express').Router();
const bcrypt = require('bcrypt');
const dataValidation = require('../utils/dataValidation');
const security = require('../utils/security');
const User = require('../models/user');
const authMiddleware = require('../middleware/auth');
const ChatRoom = require('../models/chatRoom');
const Image = require('../models/image');
const multer = require('multer');
const RoomMessage = require('../models/roomMessage');

const upload = multer();

// Route để tạo phòng chat mới
router.post('/', authMiddleware.requireLogin, async (req, res) => {
    try {
        const { name } = req.body;

        if (name != '' && name != null) {
            const isExist = await ChatRoom.findOne({ name });
            if (isExist != null) {
                return res.send({
                    status: 0,
                    message: 'Error: Room is already exist'
                });
            }

            await ChatRoom.create({
                name
            });
        }
        else {
            return res.send({
                status: 0,
                message: 'Error: Room name cannot be empty'
            });
        }

        res.send({
            status: 1,
            message: 'Create room successful'
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to create chat room' });
    }
});

// Route để lấy danh sách các phòng chat
router.get('/', async (req, res) => {
    try {
        const rooms = await ChatRoom.find();
        res.send({
            status: 1,
            message: 'Get rooms information successfull',
            data: {
                rooms
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch chat rooms' });
    }
});

router.get('/:room_id', authMiddleware.requireLogin, async (req, res) => {
    try {
        const room = await ChatRoom.findById(req.params.room_id);
        res.send({
            status: 1,
            message: 'Get room information successfull',
            data: {
                room
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch chat rooms' });
    }
});

// Get all room messages
router.get('/:room_id/message', async (req, res) => {
    console.log("room_id " + req.params.room_id);
    // console.log("my_id " + req.user);
    // const messages = await RoomMessage.find();
    const messages = await RoomMessage.find({ room_id: req.params.room_id });
    messages.sort((m1, m2) => m1.created_at - m2.created_at);
    res.send({
        status: 1,
        message: 'Get room messages successful',
        data: {
            messages: messages
        }
    });
});

// Delete room messages by id
router.delete('/delete/:id', (req, res) => {
    RoomMessage.findByIdAndDelete(req.params.id)
        .then(data => {
            res.send({
                status: 1,
                message: "Delete message succesful",
                data: data
            });
        })
        .catch(err => {
            res.send({
                status: 0,
                message: "Error while deleting message",
                data: err
            })
        });
});



////////////////////////////////

// Route để tạo tin nhắn mới trong phòng chat
// router.post('/rooms/:roomId/messages', async (req, res) => {
//     const roomId = req.params.roomId;
//     const content = req.body.content;

//     try {
//         const chatRoom = new ChatRoom(req.params, req.body);
//         chatRoom.save()
//             .then(res.json('oke'));
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to create message' });
//     }
// });

// Route để lấy danh sách tin nhắn trong phòng chat
// router.get('/rooms/:roomId/messages', async (req, res) => {
//     const roomId = req.params.roomId;

//     try {
//         // const messages = await MongoDBService.getMessages(roomId);
//         ChatRoom.findOne({ _id: roomId }).then((message) => {
//             res.json(message);
//         })
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ error: 'Failed to fetch messages' });
//     }
// });
// Route để gửi yêu cầu tham gia phòng chat
// router.post('/api/rooms/:roomId/join', async (req, res) => {
//     const roomId = req.params.roomId;
//     const userId = req.body.userId; // ID của người dùng muốn tham gia

//     try {
//         // Kiểm tra xem phòng chat có tồn tại không
//         const room = await ChatRoom.findById(roomId);
//         if (!room) {
//             return res.status(404).json({ error: 'Room not found' });
//         }

//         // Thực hiện xử lý yêu cầu tham gia phòng chat ở đây
//         // Ví dụ: lưu thông tin người dùng vào danh sách tham gia phòng
//         room.participants.push(userId);
//         await room.save();

//         res.json({ message: 'Join room successfully' });
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to join room' });
//     }
// });



//gửi yêu cầu tham gia phòng chat
router.post('/api/rooms/:roomId/join', async (req, res) => {
    const roomId = req.params.roomId;
    const userId = req.body.userId;

    try {
        const room = await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Kiểm tra xem người dùng đã gửi yêu cầu trước đó chưa
        if (room.pendingParticipants.includes(userId)) {
            return res.status(400).json({ error: 'Request already sent' });
        }

        room.pendingParticipants.push(userId);
        await room.save();

        res.json({ message: 'Request sent successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to send request' });
    }
});
//xem ds ai xin vào phòng chat
router.get('/api/rooms/:roomId/pending-requests', async (req, res) => {
    const roomId = req.params.roomId;

    try {
        const room = await ChatRoom.findById(roomId).populate('pendingParticipants');
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        res.json(room.pendingParticipants);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pending requests' });
    }
});
//duyệt người vào phòng chat
router.put('/api/rooms/:roomId/approve/:userId', async (req, res) => {
    const roomId = req.params.roomId;
    const userId = req.params.userId;

    try {
        const room = await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Kiểm tra xem người dùng đã được chấp nhận trước đó chưa
        if (room.approvedParticipants.includes(userId)) {
            return res.status(400).json({ error: 'User already approved' });
        }

        // Di chuyển người dùng từ danh sách chờ duyệt sang danh sách được chấp nhận
        room.pendingParticipants.pull(userId);
        room.approvedParticipants.push(userId);
        await room.save();

        res.json({ message: 'User approved successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to approve user' });
    }
});
//xem ai đã dược duyệt
router.get('/api/rooms/:roomId/approved-participants', async (req, res) => {
    const roomId = req.params.roomId;

    try {
        const room = await ChatRoom.findById(roomId).populate('approvedParticipants');
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        res.json(room.approvedParticipants);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch approved participants' });
    }
});
// từ chối yêu cầu tham gia phòng chat
router.put('/api/rooms/:roomId/reject/:userId', async (req, res) => {
    const roomId = req.params.roomId;
    const userId = req.params.userId;

    try {
        const room = await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Kiểm tra xem người dùng đã bị từ chối trước đó chưa
        if (room.rejectedParticipants.includes(userId)) {
            return res.status(400).json({ error: 'User already rejected' });
        }

        // Di chuyển người dùng từ danh sách chờ duyệt sang danh sách bị từ chối
        room.pendingParticipants.pull(userId);
        room.rejectedParticipants.push(userId);
        await room.save();

        res.json({ message: 'User rejected successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reject user' });
    }
});
// xem danh sách bị từ chối
router.get('/api/rooms/:roomId/rejected-participants', async (req, res) => {
    const roomId = req.params.roomId;

    try {
        const room = await ChatRoom.findById(roomId).populate('rejectedParticipants');
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        res.json(room.rejectedParticipants);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch rejected participants' });
    }
});
// // lấy thông tin chi tiet cua tin nhan
// router.get('/api/rooms/:roomId/messages/:messageId', async (req, res) => {
//     const { roomId, messageId } = req.params;

//     try {
//         const room = await ChatRoom.findById(roomId);
//         if (!room) {
//             return res.status(404).json({ error: 'Room not found' });
//         }

//         const message = await Message.findById(messageId);
//         if (!message) {
//             return res.status(404).json({ error: 'Message not found' });
//         }

//         res.json(message);
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to fetch message' });
//     }
// });
// lấy thông tin chi tiết trong lịch sử chat
//const roomId = 'your_room_id';
//const messageId = 'your_message_id';

// fetch(`/api/rooms/${roomId}/messages/${messageId}`)
//     .then(response => response.json())
//     .then(message => {
//         // Xử lý thông tin chi tiết của tin nhắn
//         console.log(message);
//     })
//     .catch(error => {
//         console.error(error);
//     });
//moi ai do vao nhom
router.post('/api/rooms/:roomId/invite', async (req, res) => {
    const { roomId } = req.params;
    const { userId } = req.body;

    try {
        const room = await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        console.log(room);
        // Kiểm tra xem người dùng đã tồn tại trong danh sách đã mời hay chưa
        if (room.invitedUsers.includes(userId)) {
            return res.status(400).json({ error: 'User already invited' });
        }
        // Kiểm tra xem người dùng đã tồn tại trong danh sách phòng hay chưa
        if (room.approvedParticipants.includes(userId)) {
            return res.status(400).json({ error: 'User already approved' });
        }
        // Kiểm tra xem người dùng đã tồn tại trong danh sách xin vào hay chưa
        if (room.pendingParticipants.includes(userId)) {
            return res.status(400).json({ error: 'User already approved' });
        }


        // Mời người dùng vào phòng chat
        room.invitedUsers.push(userId);
        await room.save();

        res.json({ message: 'User invited successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to invite user' });
    }
});
//chap nhan vao nhom 
router.post('/api/rooms/:roomId/accept-invite', async (req, res) => {
    const { roomId } = req.params;
    const { userId } = req.body;

    try {
        const room = await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Kiểm tra xem người dùng đã được mời hay chưa
        if (!room.invitedUsers.includes(userId)) {
            return res.status(400).json({ error: 'User not invited' });
        }

        // Thêm người dùng vào phòng chat
        room.invitedUsers = room.invitedUsers.filter(id => id !== userId);
        room.participants.push(userId);
        await room.save();

        res.json({ message: 'User added to chat room successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add user to chat room' });
    }
});
// router.post('/upload', upload.single('image'), async (req, res) => {
//     try {
//         if (!req.file) {
//             console.log(req.file)
//             return res.status(400).send('Không có tệp tin được tải lên');
//         }

//         const newImage = new Image({
//             name: req.file.originalname,
//             data: req.file.buffer.toString('base64')
//         });

//         await newImage.save();

//         res.send('Ảnh đã được tải lên và lưu vào cơ sở dữ liệu');
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Lỗi khi lưu ảnh vào cơ sở dữ liệu');
//     }
// });

// add ai đó vào nhóm 
router.post('/chatroom/:roomId/addUser/:userId', async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const userId = req.params.userId;

        // Tìm kiếm phòng chat với roomId tương ứng
        const chatRoom = await ChatRoom.findById(roomId);

        if (!chatRoom) {
            return res.status(404).send('Không tìm thấy phòng chat');
        }

        // Tìm kiếm người dùng với userId tương ứng
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send('Không tìm thấy người dùng');
        }

        // Thêm người dùng vào danh sách người tham gia phòng chat
        chatRoom.approvedParticipants.push(userId);
        await chatRoom.save();

        res.send('Người dùng đã được thêm vào phòng chat thành công');
    } catch (error) {
        console.error(error);
        res.status(500).send('Lỗi khi thêm người dùng vào phòng chat');
    }
});
// xem ai trong phòng chat 
router.get('/chatroom/:roomId/users', async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const userId = req.user.id; // Assume you have the authenticated user ID

        // Tìm kiếm phòng chat với roomId tương ứng
        const chatRoom = await ChatRoom.findById(roomId);

        if (!chatRoom) {
            return res.status(404).send('Không tìm thấy phòng chat');
        }

        // Kiểm tra xem người dùng hiện tại là một trong các người tham gia
        const isMember = chatRoom.approvedParticipants.includes(userId);

        if (!isMember) {
            return res.status(403).send('Bạn không phải là thành viên của nhóm chat');
        }

        const users = chatRoom.approvedParticipants;

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).send('Lỗi khi lấy danh sách người dùng trong phòng chat');
    }
});

module.exports = router;
