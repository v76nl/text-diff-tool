# テキスト比較ツール (Text Diff Tool)

2つのテキストを入力し差分を表示するWebアプリ。

## 開発環境のセットアップ

pnpmを使用して依存関係をインストールし、ローカルサーバーを起動する。

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm run dev

# プロダクションビルド
pnpm run build
```

## ファイル構造

```text
.
├── src/
│   ├── main.ts
│   └── style.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```
