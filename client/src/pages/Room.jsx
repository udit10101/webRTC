import React, { useEffect, useCallback, useState } from 'react';
import { useSocket } from '../providers/Socket';
import { usePeer } from '../providers/Peer';
import ReactPlayer from 'react-player';
const Room = () => {
    const { socket } = useSocket();
    // eslint-disable-next-line no-unused-vars
    const { peer, createOffer, createAnswer, setRemoteAnswer, sendStream, remoteStream, setRemoteStream } = usePeer();
    const [myStream, setMyStream] = useState();
    const [remoteEmailId, setRemoteEmailId] = useState();

    // eslint-disable-next-line no-unused-vars
    const [localAnswer, setLocalAnswer] = useState(null);
    const getUserMediaStream = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        return stream;
    }, []);
    const myVideo = useCallback(async () => {
        const stream = await getUserMediaStream();
        setMyStream(stream);
    }, [getUserMediaStream]);

    const handleNewUserJoined = useCallback(
        async (data) => {
            const { emailId } = data;
            console.log('New user Joined', emailId);
            const offer = await createOffer();
            socket.emit('call-user', { emailId, offer });
            setRemoteEmailId(emailId);
        },
        [createOffer, socket],
    );
    const handleIncomingCall = useCallback(
        async (data) => {
            const { offer, from } = data;
            console.log('Incoming call from ', from);
            const answer = await createAnswer(offer);
            setLocalAnswer(answer);
            socket.emit('call-accepted', { emailId: from, answer });
        },
        [createAnswer, socket],
    );
    const handleCallAccepted = useCallback(
        async (data) => {
            const { answer } = data;
            await setRemoteAnswer(answer);
            console.log('call got accepted', answer);
    
            sendStream(myStream);
        },
        [myStream, sendStream, setRemoteAnswer],
    );
    const handleNegotiationNeeded = useCallback(async () => {
        await peer.setLocalDescription();
        const offer = peer.localDescription;
        console.log('neg needed');
        socket.emit('call-user', { emailId: remoteEmailId, offer });
        // console.log('negotiation offer sent to:', remoteEmailId);
    }, [peer, remoteEmailId, socket]);

    const handleTrackEvent = useCallback(
        async (ev) => {
            console.log('reached handle track event');
            const streams = ev.streams;
            setRemoteStream(streams[0]);
            // console.log('remote stream set on this user (im 2nd joined)', streams[0]);
            console.log(peer.localDescription.type === 'answer');
            if (peer.localDescription.type === 'answer') {
                console.log('Im 2nd user and now sending my stream to 1st user');
                const strm = await getUserMediaStream();
                console.log('my stream :', strm, strm.id);
                sendStream(strm);
            }

            // eslint-disable-next-line react-hooks/exhaustive-deps
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [getUserMediaStream, sendStream, setRemoteStream],
    );
    const handleConnectionStateChanged = useCallback(
        (event) => {
            if (peer.connectionState === 'connected') {
                console.log('peer connected!');
                // peer.removeEventListener('negotiationneeded',handleNegotiationNeeded)
            }
        },
        [peer],
    );
    useEffect(() => {
        myVideo();

        socket.on('user-joined', handleNewUserJoined);
        socket.on('incoming-call', handleIncomingCall);
        socket.on('call-accepted', handleCallAccepted);

        return () => {
            socket.off('user-joined', handleNewUserJoined);
            socket.off('incoming-call', handleIncomingCall);
            socket.off('call-accepted', handleCallAccepted);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleCallAccepted, handleIncomingCall, handleNewUserJoined, myVideo, socket]);
    useEffect(() => {
        peer.addEventListener('negotiationneeded', handleNegotiationNeeded);
        peer.addEventListener('track', handleTrackEvent);
        peer.addEventListener('connectionstatechange', handleConnectionStateChanged);
        return () => {
            peer.removeEventListener('negotiationneeded', handleNegotiationNeeded);
            peer.removeEventListener('connectionstatechange', handleConnectionStateChanged);
        };
    }, [handleConnectionStateChanged, handleNegotiationNeeded, handleTrackEvent, peer]);
    return (
        <div className="roomContainer">
            <div> room page</div>
            <ReactPlayer url={myStream} playing />
            <ReactPlayer url={remoteStream} playing />
        </div>
    );
};
export default Room;
