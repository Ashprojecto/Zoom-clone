"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {generateRoomId} from "@/lib/utils"

export default function RoomForm(){
    const [roomId, setRoomId] = useState("")
    const router = useRouter()

    const handleJoin = (e:React.FormEvent)=>{
        e.preventDefault()
        if(!roomId.trim()) return
        router.push(`/room/${roomId}`)
    }

    const handleRandomJoin =()=>{
        const newId = generateRoomId()
        router.push(`/room/${newId}`)
    }

    return(
        <form onSubmit={handleJoin} className="space-y-4">
            <input type="text" value={roomId} onChange={(e)=>setRoomId(e.target.value)} placeholder="Enter Room Id" className="border rounded px-3 py-2 w-full text-black" />
            <div className="flex gap-4">
                <button type="submit" className="bg-blue-600 text-white cursor-pointer px-4 py-2 rounded">Join Room</button>
                <button type="button" onClick={handleRandomJoin} className="bg-gray-300 px-4 py-2 rounded cursor-pointer ">Random Room</button>
            </div>
        </form>
    )


}