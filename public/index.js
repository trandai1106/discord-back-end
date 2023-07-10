const socket = io('/');
const peer = new Peer();
let myVideoStream;
let myId;
const videoGrid = document.getElementById('videoDiv')
const myvideo = document.createElement('video');
myvideo.muted = true;
const peerConnections = {};

const videoBtn = document.getElementById('video-btn');
const micBtn = document.getElementById('mic-btn');
const screenBtn = document.getElementById('screen-btn');
const outBtn = document.getElementById('out-btn');

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then((stream) => {
  myVideoStream = stream;
  addVideo(myvideo, stream);
  peer.on('call', call => {
    call.answer(stream);
    const vid = document.createElement('video');

    call.on('stream', userStream => {
      addVideo(vid, userStream);
    });

    call.on('error', (err) => {
      alert(err)
    });

    call.on("close", () => {
      vid.remove();
    });

    peerConnections[call.peer] = call;
  })
}).catch(err => {
  alert(err.message);
});

peer.on('open', (id) => {
  myId = id;
  socket.emit("newCall", id, roomID);
});

peer.on('error', (err) => {
  alert(err.type);
});

socket.on('newuserJoinedCall', id => {
  const call = peer.call(id, myVideoStream);
  const vid = document.createElement('video');
  console.log("new user joined");

  call.on('error', (err) => {
    alert(err);
  });

  call.on('stream', userStream => {
    console.log("stream", userStream);
    addVideo(vid, userStream);
  });

  call.on('close', () => {
    vid.remove();
    console.log("user disconect");
  });

  peerConnections[id] = call;
});

socket.on('userLeaveCall', id => {
  if (peerConnections[id]) {
    peerConnections[id].close();
  }

  // if (peerConnections[myId] === peerConnections) {
  //   window.close();
  // }
});

const addVideo = (video, stream) => {
  console.log("addVideo");
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video);
};

videoBtn.addEventListener('click', () => {
  console.log("videoBtn click");
});

micBtn.addEventListener('click', () => {
  console.log("micBtn click");
});

screenBtn.addEventListener('click', () => {
  console.log("screenBtn click");
});

outBtn.addEventListener('click', () => {
  console.log("outBtn click");
});
