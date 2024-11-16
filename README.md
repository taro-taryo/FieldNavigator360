# FieldNavigator360

FieldNavigator360 は、現場担当者とオペレーター間でリアルタイムにカメラ映像とレーザーポインタを共有するためのシステムです。このプロジェクトは、ブラウザベースで動作し、簡単にスマートフォンやPCから利用できます。

---

## 機能

1. **現場担当者向け機能（Worker）**
   - スマートフォンの背面カメラ映像をリアルタイムで取得し表示。
   - オペレーターが送信したレーザーポインタの位置を映像にオーバーレイ表示。

2. **オペレーター向け機能（Operator）**
   - 現場担当者の映像を閲覧（今後のWebRTC統合予定）。
   - 映像上でクリックした位置を現場担当者へレーザーポインタとして送信。

3. **リアルタイム通信**
   - WebSocketを使用して、現場担当者とオペレーター間で双方向の通信を実現。

---

## 必要な環境

- **Node.js**: バージョン16以上
- **npm**: Node.jsに付属
- **HTTPS**: iOS Safariの制限に対応するためSSLが必須

---

## セットアップ方法

### 1. リポジトリをクローン
```bash
git clone https://github.com/taro-taryo/FieldNavigator360.git
cd FieldNavigator360
```

### 2. 必要な依存関係をインストール
```bash
npm install
```

### 3. SSL証明書を準備
- 自己署名証明書を生成する場合：
  ```bash
  openssl req -x509 -newkey rsa:2048 -nodes -keyout server/ssl/key.pem -out server/ssl/cert.pem -days 365
  ```
- 既存の証明書を`server/ssl/`ディレクトリに配置してください。

### 4. サーバーを起動
```bash
node server/app/server.js
```

### 5. アクセス
- 現場担当者ページ: `https://<サーバーのIP>:8443/worker.html`
- オペレーターページ: `https://<サーバーのIP>:8443/operator.html`

---

## 開発の進捗

### 実装済み
- 現場担当者のカメラ映像取得・表示
- オペレーターから送信されるレーザーポインタ座標のリアルタイム描画
- WebSocketを使用した双方向通信

### 今後の予定
- WebRTCによる現場担当者の映像転送
- UI/UXの改善（モバイル最適化など）
- セキュリティ対策の強化

---

## ディレクトリ構造

```
FieldNavigator360
├── server/
│   ├── app/
│   │   ├── server.js         # メインサーバーコード
│   │   ├── wsHandler.js      # WebSocket処理
│   └── ssl/                  # SSL証明書配置ディレクトリ
│       ├── cert.pem
│       ├── key.pem
├── public/
│   ├── index.html            # トップページ
│   ├── worker.html           # 現場担当者ページ
│   ├── operator.html         # オペレーターページ
│   ├── index.js              # クライアント共通スクリプト
│   └── style.css             # 共通スタイルシート
├── package.json
└── README.md
```

---

## ライセンス

このプロジェクトはMITライセンスのもとで公開されています。詳細は[LICENSE](LICENSE)をご覧ください。

