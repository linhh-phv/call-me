# Call Me

Một MVP video call cho mobile, build trong vài tiếng. Mục đích: chứng minh bạn không cần SaaS đắt tiền để có một sản phẩm video call hoạt động — toàn bộ stack chạy được trên một con Mac, miễn phí, mã nguồn mở.

> Nếu bạn đang muốn tự dựng video call cho team / startup / khoá học và phân vân giữa "tự host hay xài Twilio/Agora/LiveKit Cloud?" — repo này là cái sandbox để trả lời câu hỏi đó.

## Stack

| Layer | Technology | Vai trò |
|---|---|---|
| App mobile | React Native 0.85 (bare, không Expo) | UI trên iOS + Android |
| WebRTC SDK | [@livekit/react-native](https://github.com/livekit/client-sdk-react-native) | Connect room, publish/subscribe track |
| Media server | [livekit-server](https://github.com/livekit/livekit) (Apache 2.0, self-host bằng Docker) | SFU forward video/audio |
| Auth backend | Node.js + Express + livekit-server-sdk | Issue JWT token cho client |

## Kiến trúc

```
┌──────────┐                      ┌──────────────┐
│  iPhone  │  ──── ws/UDP ───►   │              │
└──────────┘                      │  LiveKit     │   media SFU
                                  │  (Docker)    │
┌──────────┐                      │              │
│ Android  │  ──── ws/UDP ───►   └──────┬───────┘
└──────────┘                             │
     │                                   │
     │  ── HTTP POST /token ──►  ┌───────┴───────┐
     │                           │   Backend     │  cấp JWT,
     └───────────────────────►   │  (Node.js)    │  hardcoded
                                 └───────────────┘  user list
```

- App ↔ Backend: HTTP — đăng nhập (giả lập) + xin LiveKit JWT token
- App ↔ LiveKit: WebSocket signaling + UDP media — trực tiếp, không qua backend
- Backend không bao giờ thấy media stream

## Tính năng MVP

- 3 user hardcoded (Alice / Bob / Charlie) — không có DB, không có auth
- Tạo room ad-hoc theo tên
- Video call N-người (test với 2-3 device cùng lúc)
- Mute/unmute mic, on/off camera, **flip camera trước/sau**
- Self-view mirror như selfie chuẩn (FaceTime-style)

## Yêu cầu

- macOS với Xcode + Android Studio (hoặc 1 trong 2)
- Node 22+, npm
- Docker (Docker Desktop, Colima, hay [OrbStack](https://orbstack.dev) — repo này test với OrbStack)
- iPhone thật / Android device hoặc emulator có camera

## Cài đặt

```bash
git clone https://github.com/linhh-phv/call-me.git
cd call-me
```

### 1. Set IP của Mac

Tìm IP LAN của Mac (cùng dải với điện thoại):

```bash
ipconfig getifaddr en0     # ví dụ: 192.168.1.42
```

Cập nhật ở 2 nơi:

- **Root**: `cp .env.example .env` rồi sửa `LIVEKIT_NODE_IP=192.168.1.42` (LiveKit dùng IP này khi tạo ICE candidate)
- **App**: mở [app/src/config.ts](app/src/config.ts) sửa `HOST_IP = '192.168.1.42'`

### 2. Start LiveKit (Docker)

```bash
docker compose up -d
curl http://localhost:7880      # phải trả "OK"
```

LiveKit chạy ở `--dev` mode, dùng API key `devkey` / secret `secret` (đã wired sẵn trong [backend/.env.example](backend/.env.example)).

### 3. Backend

```bash
cd backend
npm install
cp .env.example .env       # đã pre-fill, không cần sửa nếu dùng LiveKit local
npm run dev                # http://localhost:3000
```

Endpoints:

- `GET /users` — danh sách user hardcoded
- `POST /token` `{ userId, room }` — trả JWT để client connect LiveKit

### 4. App (React Native)

```bash
cd app
npm install
cd ios && bundle install && bundle exec pod install && cd ..
npm start
```

Chạy app:

```bash
# iOS simulator (KHÔNG có camera thật, chỉ test signaling)
npx react-native run-ios

# iOS thật (cần Apple ID + cable USB-C)
npx react-native run-ios --device "Tên iPhone"

# Android emulator
npx react-native run-android
```

> **Lần đầu trên iPhone thật**: mở Xcode → click project `CallMeApp` → tab **Signing & Capabilities** → chọn Team (Add Apple ID nếu chưa có) → đổi Bundle Identifier thành `com.<tên-bạn>.callmeapp`. Sau khi cài, vào **Settings → General → VPN & Device Management** trên iPhone để Trust dev cert.

### 5. Test

Mở app trên 2 device → chọn 2 user khác nhau → nhập cùng tên room → Join.

## Triển khai lên production

LiveKit là Apache 2.0, self-host được hoàn toàn — không có fee thương mại, không giới hạn user. Lộ trình thực tế:

| Quy mô | Hạ tầng | Chi phí ước tính |
|---|---|---|
| MVP, dev local | Docker trên máy bạn (đang làm trong repo này) | $0 |
| Beta < 100 user concurrent | 1 VPS Hetzner/DO + coturn cùng máy + Caddy TLS | $5–20 / tháng |
| Scale (cluster) | Multi-node LiveKit + Redis + coturn riêng | $50–200 / tháng |
| Không muốn lo ops | LiveKit Cloud (free 50GB/mo, build tier $50/mo) | $0–50+ |

Bandwidth là chi phí chính của video call (~1.5 Mbps/user). Hetzner/OVH **không tính phí bandwidth** → self-host rẻ hơn nhiều so với AWS/GCP. Cloud bù lại bằng global edge + TURN sẵn — chỉ thực sự cần khi user ở nhiều quốc gia hoặc team không có DevOps.

## Notes về quirks gặp phải khi build

- **Android Camera2 + LiveKit**: livekit-client mặc định gắn `deviceId="default"` cho video track, Android không nhận. Phải set `videoCaptureDefaults.facingMode` ở cấp `Room`, KHÔNG set ở `setCameraEnabled()`.
- **Race condition**: gọi `setCameraEnabled(true)` ngay sau khi `LiveKitRoom` mount sẽ fail thầm lặng vì track-publisher chưa sẵn sàng. Phải đợi `useConnectionState() === ConnectionState.Connected`.
- **iOS simulator**: không có webcam → tile self-view đen. Chỉ test signaling/audio được, video phải dùng device thật hoặc Android emulator (cấu hình `hw.camera.front=webcam0`).
- **Async-storage 3.x**: ship `shared_storage` AAR trong `node_modules/.../local_repo`, phải add maven repo vào `android/build.gradle` mới resolve được.
- **LiveKit Docker trên Mac**: container cần `--node-ip <Mac LAN IP>` cho ICE — nếu không thì advertise IP nội bộ Docker, device thật không reach được.

## License

MIT — code repo này. LiveKit là Apache 2.0.
