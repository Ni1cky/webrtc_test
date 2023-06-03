const localVideo = document.getElementById("localVideo")
const remoteVideo = document.getElementById("remoteVideo")
document.addEventListener("DOMContentLoaded", () => {
    let browser_id = document.getElementById("browser_id").value
    console.log(browser_id)
});

let localPeerConnection, remotePeerConnection = null
const configuration = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302',
      ],
    },
  ],
  iceCandidatePoolSize: 10,
}
const socket = new WebSocket("ws://localhost:5000")

constraints = {video: true, audio: false}

navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    localVideo.srcObject = stream

    const videoTrack = stream.getVideoTracks()[0]

    localPeerConnection = new RTCPeerConnection(configuration)
    localPeerConnection.addEventListener("icecandidate", (event) => {
        if (event.candidate) {
            socket.send(JSON.stringify({type: "LOCAL_CANDIDATE", candidate: event.candidate}))
        }
    })

    socket.addEventListener("message", (event) => {
        const data = JSON.parse(event.data)
        if (data.type === "REMOTE_DESCRIPTION") {
            localPeerConnection.setRemoteDescription(data.description)
        }
        else if (data.type === "REMOTE_CANDIDATE") {
            localPeerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
        }
    })

    localPeerConnection.addTrack(videoTrack, stream)

    localPeerConnection.createOffer().then((description) => {
        localPeerConnection.setLocalDescription(description)
        const event = {
            type: "LOCAL_DESCRIPTION",
            description: description
        }
        socket.send(JSON.stringify(event))
    })
})

remotePeerConnection = new RTCPeerConnection(configuration)

socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data)
    if (data.type === "LOCAL_DESCRIPTION") {
        remotePeerConnection.setRemoteDescription(data.description)
        remotePeerConnection.addEventListener("icecandidate", (event) => {
            if (event.candidate) {
                socket.send(JSON.stringify({type: "REMOTE_CANDIDATE", candidate: event.candidate}))
            }
        })
        remotePeerConnection.addEventListener("track", (event) => {
            remoteVideo.srcObject = event.streams[0]
        })

        remotePeerConnection.createAnswer().then((description) => {
            remotePeerConnection.setLocalDescription(description)
            const event = {
                type: "REMOTE_DESCRIPTION",
                description: description
            }
            socket.send(JSON.stringify(event))
        })
    }
    else if (data.type === "LOCAL_CANDIDATE") {
        remotePeerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
    }
})
