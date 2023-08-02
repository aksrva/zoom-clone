const socket = io("/");
// Show Chatbox
const chatBox = document.getElementById("chat__box");
const chatBtn = document.getElementById("chat__btn");
const inputBox = document.getElementById("chat__box__message");
const allMessages = document.getElementById("all__message__box");
const sendBtn = document.getElementById("sendBtn");
const videoBtn = document.getElementById("videoBtn");
const audioBtn = document.getElementById("audioBtn");
chatBtn.addEventListener("click", () => {
  document.getElementById("chat__box").classList.toggle("show");
});
var uId;
// Video calling
const videoSection = document.getElementById("all__videos");
const initialVideo = document.createElement("video");
initialVideo.setAttribute("data-user", uId);
initialVideo.muted;

// Create Peer
console.log("PORT" + port);
var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: port,
});

let initialVideoStream;
var activeConnections = {};
var getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    initialVideoStream = stream;
    buildVideoStream(initialVideo, stream);
    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      video.setAttribute("data-user", uId);
      call.on("stream", (userVideoStream) => {
        buildVideoStream(video, userVideoStream);
      });
    });
    socket.on("user-connected", (userId) => {
      connectNewuser(userId, stream);
    });

    document.addEventListener("keydown", (e) => {
      if (e.which == 13 && inputBox.value != "") {
        sendMessage();
      }
    });
    const sendMessage = () => {
      if (inputBox.value != "") {
        socket.emit("message", inputBox.value);
        inputBox.value = "";
      }
    };
    sendBtn.addEventListener("click", () => {
      sendMessage();
    });
    socket.on("createMessage", (msg) => {
      let p = document.createElement("p");
      p.innerHTML = msg;
      allMessages.append(p);
      allMessages.scrollTop = allMessages.scrollHeight;
    });
  });

const buildVideoStream = (videoElement, stream) => {
  videoElement.srcObject = stream;
  videoElement.addEventListener("loadedmetadata", () => {
    videoElement.play();
  });
  videoSection.append(videoElement);
  let totalConnectedUser = document.getElementsByTagName("video").length;
  if (totalConnectedUser > 1) {
    for (let idx = 0; idx < totalConnectedUser; idx++) {
      document.getElementsByTagName("video")[idx].style.width =
        100 / totalConnectedUser - 10 + "%";
    }
  }
};

// Video play Pause
const pausePlay = () => {
  const isEnabled = initialVideoStream.getVideoTracks()[0].enabled;
  if (isEnabled) {
    initialVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    initialVideoStream.getVideoTracks()[0].enabled = true;
  }
};
videoBtn.addEventListener("click", () => {
  pausePlay();
});
// Audio mute and unmute
const audioMuteUnmute = () => {
  const isEnabled = initialVideoStream.getAudioTracks()[0].enabled;
  if (isEnabled) {
    initialVideoStream.getAudioTracks()[0].enabled = false;
    setMuteMode();
  } else {
    initialVideoStream.getAudioTracks()[0].enabled = true;
    setUnmuteMode();
  }
};
audioBtn.addEventListener("click", () => {
  audioMuteUnmute();
});

// Leave Call
peer.on("call", (call) => {
  getUserMedia(
    {
      video: true,
      audio: true,
    },
    (stream) => {
      call.answer(stream);
      const video = document.createElement("video");
      video.setAttribute("data-user", uId);
      call.on("stream", (remoteStream) => {
        buildVideoStream(video, remoteStream);
      });
    },
    (err) => {
      console.log("Failed to get Stream" + err);
    }
  );
});

peer.on("open", (id) => {
  uId = id;
  initialVideo.setAttribute("data-user", uId); // Set the attribute here
  socket.emit("join-room", ROOM_ID, id);
});
peer.on("close", (id) => {
  socket.emit("disconnect", ROOM_ID, id);
});

const connectNewuser = (userId, stream) => {
  var call = peer.call(userId, stream);
  activeConnections[userId] = call;
  const video = document.createElement("video");
  video.setAttribute("data-user", userId); // Use userId instead of uId
  call.on("stream", (userVideoStream) => {
    buildVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.pause();

    // Remove the disconnected user's video element
    video.remove();

    // Broadcast the disconnection event to all connected users
    socket.emit("user-disconnected", userId);

    // Adjust layout for the remaining videos
    adjustVideoLayout();
  });
};

const adjustVideoLayout = () => {
  const videos = document.querySelectorAll("video");
  const totalConnectedUser = videos.length;

  for (let idx = 0; idx < totalConnectedUser; idx++) {
    videos[idx].style.width = 100 / totalConnectedUser - 10 + "%";
  }
};

// pop up
const share__link = document.getElementById("share__link");
const shareBtn = document.getElementById("shareBtn");
const share__pop = document.getElementById("share__pop");

shareBtn.addEventListener("click", () => {
  share__link.innerText = window.location.href;
  share__pop.classList.toggle("show");
});

const copyBtn = document.getElementById("copyBtn");
copyBtn.addEventListener("click", () => {
  navigator.clipboard
    .writeText(share__link.innerText)
    .then(() => {
      console.log("Copied");
    })
    .catch((err) => {
      console.log("Copied Failed!");
    });
});

// Video Pause/play

const setPlayVideo = () => {
  videoBtn.innerHTML = `<i style='color: red;' class="fa-solid fa-video-slash"></i>`;
};
const setStopVideo = () => {
  videoBtn.innerHTML = `<i class="fa-solid fa-video"></i>`;
};

// Audio Mute/Unmute
const setMuteMode = () => {
  audioBtn.innerHTML = `<i style="color: red;" class="fa-solid fa-microphone-slash"></i>`;
};
const setUnmuteMode = () => {
  audioBtn.innerHTML = `<i class="fa-solid fa-microphone"></i>`;
};
