# FieldNavigator360

FieldNavigator360 は、現場担当者とオペレーター間でリアルタイムにカメラ映像とレーザーポインタを共有するためのシステムです。このプロジェクトは、ブラウザベースで動作し、スマートフォンやPCから簡単に利用できます。

---

## 主な機能

### **現場担当者向け機能（Worker）**
- スマートフォンのカメラ映像をリアルタイムで取得し表示。
- オペレーターが送信したレーザーポインタを映像に赤色でオーバーレイ表示。
- カメラ映像にオーバーレイされたレーザーポインタをH.264形式でエンコードし、オペレーターへ送信。

### **オペレーター向け機能（Operator）**
- 現場担当者の映像を閲覧し、操作する映像上でレーザーポインタを青色で表示。
- 映像上でクリックした位置を現場担当者へレーザーポインタ座標として送信。

### **リアルタイム通信**
- WebSocketを使用し、現場担当者とオペレーター間で双方向の通信を実現。

---

## 必要な環境

- **Node.js**: バージョン16以上
- **npm**: Node.jsに付属
- **HTTPS**: iOS Safariの制限に対応するためSSLが必須

---

## セットアップ方法

### 1. リポジトリをクローン
```bash
git clone https://github.com/taro-taryo/FieldNavigator360.git cd FieldNavigator360
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

- 既存の証明書を `server/ssl/` ディレクトリに配置してください。

### 4. サーバーを起動
```bash
node server/app/server.js
```


### 5. アクセス
- 現場担当者ページ: `https://<サーバーのIP>:8443/worker.html`
- オペレーターページ: `https://<サーバーのIP>:8443/operator.html`

---

## 開発の進捗状況

### 実装済み
- 現場担当者のカメラ映像取得とリアルタイム送信
- カメラ映像へのレーザーポインタオーバーレイ
- WebSocketによる双方向通信
## 今後の予定

### スケーラビリティの向上
1. **[セッション管理の強化](https://github.com/taro-taryo/FieldNavigator360/issues/4)**
   - 現在は 1 vs 1 のセッションに対応していますが、多数 vs 多数のセッションを同時に実行できるようにします。
   - 各セッションをユニークなIDで管理し、状態を分離する機能を追加。

1. **[リアルタイム通信の拡張](https://github.com/taro-taryo/FieldNavigator360/issues/5)**
   - 同時に複数のセッションを処理し、低レイテンシを維持する仕組みを構築。
   - WebSocketとWebRTCを併用し、映像・音声ストリーミングの効率を向上。

1. **[負荷分散の導入](https://github.com/taro-taryo/FieldNavigator360/issues/6)**
   - NGINXやロードバランサーを活用して、WebSocketおよびWebRTCサーバーの負荷を分散。
   - サーバー間でセッションデータを共有し、安定性を向上。

1. **[水平スケーリングの実現](https://github.com/taro-taryo/FieldNavigator360/issues/7)**
   - サーバーインスタンスを増やすことで、複数のセッションを効率的に処理。
   - クラウドサービス（AWS, GCP, Azure）の活用を検討。

1. **[Redisによるセッションデータ管理](https://github.com/taro-taryo/FieldNavigator360/issues/8)**
   - 高速キャッシュシステム（Redis）を使用し、セッション情報を効率的に保存。
   - 同時接続ユーザー数が増加しても、リアルタイム性を損なわない構造を構築。

1. **[NAT越え対応の強化](https://github.com/taro-taryo/FieldNavigator360/issues/9)**
   - STUN/TURNサーバーを使用して、NAT越えを確実に行う仕組みを実装。
   - WebRTCによるP2P接続を優先し、TURNサーバーはフォールバックとして使用。

1. **[モニタリングとログ強化](https://github.com/taro-taryo/FieldNavigator360/issues/10)**
   - セッションごとの接続数、通信量、レイテンシをリアルタイムで監視。
   - ログを統合し、スケーラビリティ改善の効果を可視化。

---

### ユーザー体験の向上
1. **[UI/UXの改善](https://github.com/taro-taryo/FieldNavigator360/issues/11)**
   - モバイルデバイスでの操作性を向上。
   - 多数のセッションを簡単に切り替えられるインターフェイスを実装。

1. **[セキュリティ対策](https://github.com/taro-taryo/FieldNavigator360/issues/12)**
   - 各セッションの認証と暗号化を強化。
   - セッションハイジャックや不正アクセスへの対応策を実装。

1. **[WebRTCによる映像・音声転送](https://github.com/taro-taryo/FieldNavigator360/issues/13)**
   - WebRTCを活用し、低レイテンシかつ高画質な映像・音声の転送を実現。
   - 映像品質（解像度、フレームレート）を動的に調整可能に。

---


## ライセンス

このプロジェクトは MIT ライセンスのもとで公開されています。詳細は [LICENSE](LICENSE) をご覧ください。
