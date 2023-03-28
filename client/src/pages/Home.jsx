import React,{useState,useEffect,useCallback} from 'react'
import {useNavigate} from 'react-router-dom'
import { useSocket } from '../providers/Socket'
const Homepage = ()=>{
    const {socket}=useSocket();
    const [email,setEmail]=useState('')
    const [roomId,setRoomId]=useState('')
    const navigate=useNavigate()
    const handleUserJoined=()=>{
        socket.emit('join-room',{emailId:email,roomId})
    }
    const handleRoomJoined=useCallback(({roomId})=>{
        navigate(`/room/${roomId}`)
    },[navigate])


    useEffect(()=>{
        socket.on('joined-room',handleRoomJoined)

        return ()=>{
            socket.off('joined-room',handleRoomJoined)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[socket])

    return(
        <div className="homepage-container">
            <div>
                <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" placeholder='enter email' />
                <input value={roomId} onChange={(e)=>setRoomId(e.target.value)} type="text" placeholder='enter room' />
                <button onClick={handleUserJoined}>Enter Room</button>
            </div>
        </div>
    )
}
export default Homepage;