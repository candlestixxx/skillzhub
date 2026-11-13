# WebRTC Implementation Research for SkillzHub Live Ingest

To fulfill the "Real-time Live Bounties" feature requirement from `IDEAS.md`, we need to transition from asynchronous video uploads to synchronous WebRTC streams.

## Frontend (Next.js React Native App)
**Recommendation:** Native WebRTC API (`RTCPeerConnection`)
Next.js running in modern browsers supports the WebRTC standard natively without requiring heavy external libraries. For the planned React Native port, `react-native-webrtc` is the industry standard wrapper exposing the same W3C interfaces.
*   **Signaling:** We will need to implement a lightweight signaling mechanism (e.g., using WebSockets or Server-Sent Events in Next.js API routes) to exchange SDP offers and ICE candidates between the creator and the backend.

## Backend (Go Microservice)
**Recommendation:** `pion/webrtc`
Because we are shifting the video extraction pipeline to Go (`worker-go`), we should leverage `github.com/pion/webrtc/v4`.
*   **Why Pion?** It is a pure-Go implementation of WebRTC with zero CGO dependencies. This makes it incredibly easy to compile and deploy as a standalone, high-performance microservice.
*   **Architecture:** The Next.js frontend will signal the Go backend. The Go backend will use Pion to accept the WebRTC stream, process the live video frames, and run real-time QC checks (e.g., frame drops, resolution verification) before saving the finalized stream to the S3 data lake.

## Action Plan
1.  Implement a WebSocket signaling server within the Go microservice.
2.  Use `pion/webrtc` to create a generic media ingest handler.
3.  Update the Creator Dashboard in Next.js to use `navigator.mediaDevices.getUserMedia` and `RTCPeerConnection` to broadcast directly to the Go ingest server.