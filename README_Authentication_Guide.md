Nowl Authentication Guide

1. 概要

Nowlのログイン機能は、Reactフロントエンド + Spring Bootバックエンド + JWT認証 で構成されています。
本ガイドは、新人エンジニアや他のエンジニアが改修・拡張を行いやすいように整理したものです。

⸻

2. 全体構成フロー

フェーズ	コンポーネント	主なファイル	主な役割
① フロント入力	React (Login.jsx)	/src/pages/Login.jsx	ユーザーがメール／パスワードを入力し、APIへPOSTする
② APIリクエスト送信	Fetch API	同上	POST /auth/login にJSON形式でログイン情報を送信
③ 認証処理	Spring Boot Controller	AuthController.java	認証マネージャーにユーザー名＋パスワードを渡し、認証を実行
④ ユーザ検索	UserDetailsServiceImpl.java	DBからusernameまたはemailでユーザーを検索	
⑤ パスワード検証	BCryptPasswordEncoder	Spring Security内部	入力パスワードとDBのハッシュを比較（認証成功/失敗）
⑥ JWTトークン生成	JwtUtils	JwtUtils.java	認証済みユーザー情報を基にJWTトークンを生成
⑦ JWTレスポンス返却	AuthController	同上	{ "token": "xxxxx.yyyyy.zzzzz" } を返す
⑧ フロント保存・遷移	React (Login.jsx)	同上	JWTをlocalStorageに保存し、/dashboardへ遷移
⑨ 認証済みアクセス	Spring Security Filter	SecurityConfig.java	JWTの署名を検証し、保護ルートへアクセス許可


⸻

3. ファイル構成と役割

種別	ファイル名	主な関数／メソッド	説明
フロント	Login.jsx	handleLogin()	入力→API送信→レスポンス受取・JWT保存・画面遷移
APIルート	AuthController.java	login()	認証処理呼び出し・JWT発行・返却
認証サービス	UserDetailsServiceImpl.java	loadUserByUsername()	DBからユーザー情報を取得（username or email）
DBアクセス	UserRepository.java	findByUsername(), findByEmail()	DB検索ロジック
JWT管理	JwtUtils.java	generateToken(), validateToken()	JWT発行・署名検証
ユーザ詳細モデル	UserDetailsImpl.java	getters for username, password, role	Spring Securityが使うユーザー定義情報
セキュリティ設定	SecurityConfig.java	filterChain()	/auth/**を公開、他をJWT保護ルート化
ユーザエンティティ	User.java	フィールド（id, username, email, password, role）	DBテーブル構造定義


⸻

4. ログイン時データフロー

ステップ	処理	データ内容
①	ユーザーがReact画面でログインボタン押下	{email: "test@mail.com", password: "abc123"}
②	React → POST /auth/login	JSONでリクエスト
③	AuthController が authenticationManager.authenticate() 呼び出し	内部で UserDetailsServiceImpl が呼ばれる
④	UserDetailsServiceImpl が DB からユーザーを取得	User(username="test", password="$2a$10$...")
⑤	パスワード比較（BCrypt）	OKなら認証成功、NGなら403
⑥	JWTを生成 (JwtUtils.generateToken)	{ "sub": "test@mail.com", "role": "ROLE_USER", "exp": ... }
⑦	フロントへトークン返却	{ "token": "xxxxx.yyyyy.zzzzz" }
⑧	フロントが localStorage に保存	localStorage.setItem("jwt", token)
⑨	次回リクエストにJWTをHeaderで送信	Authorization: Bearer <token>


⸻

5. 改修手順書（新人向け）

改修目的	修正ファイル	修正ポイント	注意事項
ログイン画面デザイン変更	Login.jsx	HTML構造・CSSクラスを編集	Fetch構文・localStorage処理は削除しない
APIエンドポイント変更	Login.jsx / .env	fetch("http://localhost:8080/auth/login") → 新URL	CORS設定に注意
認証方式メール専用化	UserDetailsServiceImpl.java	findByUsername() を削除、findByEmail() のみ使用	登録時もemail必須化
JWT有効期限変更	JwtUtils.java	expirationMs を変更	クライアント側自動リフレッシュも検討
権限(Role)追加	User.java, SecurityConfig.java	Role定義を追加、保護ルート設定	ROLE_接頭辞忘れず
認証失敗メッセージ変更	AuthController.java	ResponseEntity.status(403).body(...)	メッセージは統一


⸻

6. 補足
	•	JWTはStateless（セッションレス）なので、DBにセッションを持たずスケーラブル。
	•	Spring Securityの責務分離：
	•	AuthController：HTTP層
	•	UserDetailsServiceImpl：認証データ層
	•	JwtUtils：トークン層
→ この3つを改修すれば認証全体を扱える。
	•	デザイン変更はフロントのみで可能だが、認証処理を変更する場合はバックエンドも同時修正が必要。