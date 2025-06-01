import { useEffect, useRef, useState } from "react";
import socket from "@/lib/socket";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function useWebRTC(roomId: string) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const isOfferCreated = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      // Running on server - do nothing
      return;
    }

    let isMounted = true;

    const start = async () => {
      if (!isMounted) return;

      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }

      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      peerRef.current = new RTCPeerConnection(ICE_SERVERS);

       peerRef.current.onconnectionstatechange = () => {
    console.log("Connection state:", peerRef.current?.connectionState);
  };

      localStream.getTracks().forEach((track) => {
        peerRef.current?.addTrack(track, localStream);
      });

      peerRef.current.ontrack = (event) => {
        const [stream] = event.streams;
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      };

      peerRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("signal", {
            roomId,
            data: { type: "ice-candidate", candidate: event.candidate },
          });
        }
      };

      socket.emit("join-room", roomId);

      socket.emit("ready-for-call", roomId);

socket.on("ready-for-call", async () => {
  if (peerRef.current && !isOfferCreated.current) {
    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);
    isOfferCreated.current = true;

    socket.emit("signal", {
      roomId,
      data: { type: "offer", offer },
    });
  }
});


      socket.on("user-joined", async (isInitiator: boolean) => {
        if (isInitiator && peerRef.current && !isOfferCreated.current) {
          const offer = await peerRef.current.createOffer();
          await peerRef.current.setLocalDescription(offer);
          isOfferCreated.current = true;
          socket.emit("signal", {
            roomId,
            data: { type: "offer", offer },
          });
        }
      });

      socket.on("signal", async ({ data }) => {
        if (!peerRef.current) return;

        try {
          if (data.type === "offer") {
            await peerRef.current.setRemoteDescription(
              new RTCSessionDescription(data.offer)
            );

            for (const candidate of pendingCandidates.current) {
              await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingCandidates.current = [];

            const answer = await peerRef.current.createAnswer();
            await peerRef.current.setLocalDescription(answer);

            socket.emit("signal", {
              roomId,
              data: { type: "answer", answer },
            });
          } else if (data.type === "answer") {
            if (
              peerRef.current.signalingState === "have-local-offer" ||
              peerRef.current.signalingState === "stable"
            ) {
              await peerRef.current.setRemoteDescription(
                new RTCSessionDescription(data.answer)
              );

              for (const candidate of pendingCandidates.current) {
                await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
              }
              pendingCandidates.current = [];
            } else {
              console.warn(
                "Ignoring answer, signalingState:",
                peerRef.current.signalingState
              );
            }
          } else if (data.type === "ice-candidate") {
            const remoteDesc = peerRef.current.remoteDescription;
            if (!remoteDesc || remoteDesc.type === null) {
              pendingCandidates.current.push(data.candidate);
            } else {
              await peerRef.current.addIceCandidate(
                new RTCIceCandidate(data.candidate)
              );
            }
          }
        } catch (err) {
          console.error("Error handling signal data:", err);
        }
      });
    };

    start();

    return () => {
      isMounted = false;
      socket.off("user-joined");
      socket.off("signal");
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
      pendingCandidates.current = [];
      isOfferCreated.current = false;
    };
  }, [roomId]);

  return { localVideoRef, remoteVideoRef, remoteStream };
}
