# Sleact nest web-server

## 📒구현 기능 - 참조 예제
### 📌 passport-local, cookie-session 로그인
  - local.strategy.ts
  - local.serializer.ts
  - local-auth.guard.ts

### 📌 Custom decorator 생성
  - src/common/decorator/user.decorator.ts
  - 

### 📌  nest swagger 사용 api docs 생성
  - 세팅 main.ts

### 📌 express multer, image upload
  - channels.controller.ts
    - createWorkspaceChannelImages() 참고
  - static file 제공 디렉토리 설정
    - main.ts | app.module.ts 택 1

### 📌 websocket, socketIO
  - events module 참조
