import { signalingService } from "./signalingService";

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private onTrackCallback: ((stream: MediaStream) => void) | null = null;
  private onDataCallback: ((data: any) => void) | null = null;
  private onConnectionStateChange: ((state: RTCPeerConnectionState) => void) | null = null;

  constructor(
    private targetDeviceId: string,
    private isInitiator: boolean
  ) {
    this.init();
  }

  private init() {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };

    this.peerConnection = new RTCPeerConnection(config);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        signalingService.getSocket()?.emit("ice-candidate", {
          to: this.targetDeviceId,
          candidate: event.candidate,
        });
      }
    };

    this.peerConnection.ontrack = (event) => {
      if (this.onTrackCallback) {
        this.onTrackCallback(event.streams[0]);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.onConnectionStateChange && this.peerConnection) {
        this.onConnectionStateChange(this.peerConnection.connectionState);
      }
    };

    if (this.isInitiator) {
      this.dataChannel = this.peerConnection.createDataChannel("control");
      this.setupDataChannel(this.dataChannel);
    } else {
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannel(this.dataChannel);
      };
    }
  }

  private setupDataChannel(channel: RTCDataChannel) {
    channel.onmessage = (event) => {
      if (this.onDataCallback) {
        this.onDataCallback(JSON.parse(event.data));
      }
    };
    channel.onopen = () => console.log("Data channel opened");
    channel.onclose = () => console.log("Data channel closed");
  }

  async createOffer() {
    if (!this.peerConnection) return;
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    signalingService.getSocket()?.emit("offer", {
      to: this.targetDeviceId,
      offer,
    });
  }

  async handleOffer(offer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    signalingService.getSocket()?.emit("answer", {
      to: this.targetDeviceId,
      answer,
    });
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection) return;
    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  addStream(stream: MediaStream) {
    stream.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, stream);
    });
  }

  sendData(data: any) {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(JSON.stringify(data));
    }
  }

  async sendFile(file: File, onProgress: (progress: number) => void) {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") return;

    const CHUNK_SIZE = 16384; // 16KB
    const arrayBuffer = await file.arrayBuffer();
    
    // Send metadata first
    this.sendData({
      type: 'file-start',
      name: file.name,
      size: file.size,
      mimeType: file.type
    });

    let offset = 0;
    while (offset < arrayBuffer.byteLength) {
      const chunk = arrayBuffer.slice(offset, offset + CHUNK_SIZE);
      this.dataChannel.send(chunk);
      offset += CHUNK_SIZE;
      onProgress(Math.min(100, (offset / arrayBuffer.byteLength) * 100));
      
      // Small delay to prevent buffer overflow
      if (this.dataChannel.bufferedAmount > 1024 * 1024) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.sendData({ type: 'file-end' });
  }

  onTrack(callback: (stream: MediaStream) => void) {
    this.onTrackCallback = callback;
  }

  onData(callback: (data: any) => void) {
    this.onDataCallback = callback;
  }

  onStateChange(callback: (state: RTCPeerConnectionState) => void) {
    this.onConnectionStateChange = callback;
  }

  close() {
    this.dataChannel?.close();
    this.peerConnection?.close();
  }
}
