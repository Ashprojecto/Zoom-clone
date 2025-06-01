// 'use client'

// import { useEffect, useRef } from 'react'
// import { useParams } from 'next/navigation'
// import socket from '@/lib/socket'

// export default function Room() {
//   const videoRef = useRef<HTMLVideoElement | null>(null)
//   const { id: roomId } = useParams()

//   useEffect(() => {
//     // Connect to webcam
//     const startMedia = async () => {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream
//         }

//         // After media access, join room
//         socket.emit('join-room', roomId)
//       } catch (err) {
//         console.error('Failed to access media:', err)
//       }
//     }

//     startMedia()
//   }, [roomId])

//   return (
//     <div className="h-screen flex items-center justify-center bg-black">
//       <video
//         ref={videoRef}
//         autoPlay
//         playsInline
//         muted
//         className="w-full max-w-3xl rounded-lg border"
//       />
//     </div>
//   )
// }

'use client'

import { useParams } from 'next/navigation'
import  useWebRTC  from '@/hooks/useWebRTC'

export default function Room() {
  const { id: roomId } = useParams()
  const { localVideoRef, remoteVideoRef } = useWebRTC(roomId as string)

  return (
    <div className="h-screen flex flex-col md:flex-row items-center justify-center gap-4 bg-black p-4">
      <video ref={localVideoRef} autoPlay muted playsInline className="w-full md:w-1/2 border rounded" />
      <video ref={remoteVideoRef} autoPlay playsInline className="w-full md:w-1/2 border rounded" />
    </div>
  )
}

