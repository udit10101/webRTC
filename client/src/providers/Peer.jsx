// eslint-disable-next-line no-unused-vars
import React, { useMemo, useEffect, useState, useCallback } from 'react';

const PeerContext = React.createContext(null);

export const usePeer = () => React.useContext(PeerContext);

export const PeerProvider = (props) => {
    const [remoteStream, setRemoteStream] = useState(null);
    const peer = useMemo(
        () =>
            new RTCPeerConnection({
                iceServers: [
                    {
                        urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
                    },
                ],
            }),
        [],
    );
    const createOffer = async () => {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        return offer;
    };
    const createAnswer = async (offer) => {
        await peer.setRemoteDescription(offer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        return answer;
    };
    const setRemoteAnswer = async (answer) => {
        await peer.setRemoteDescription(answer);
    };
    const sendStream = useCallback(
        async (stream) => {
            const tracks = stream.getTracks();
            for (const track of tracks) {
                peer.addTrack(track, stream);
            }
        },
        [peer],
    );

    return (
        <PeerContext.Provider
            value={{ peer, createOffer, createAnswer, setRemoteAnswer, sendStream, remoteStream, setRemoteStream }}
        >
            {props.children}
        </PeerContext.Provider>
    );
};
