# AGENTS.md — chill repo operating contract

この repo を触る agent (claude code / codex / 他) が **最初に読む** ルール。
music-stack 全体の自走開発エンジンは `Music/docs/autonomy/` にある。

---

## この repo の役割

`chill` は quiet piano / trio / long-form listening の **light surface かつ harvest source**。

- synthetic felt-like piano（sample 不使用）、long rests、piano chord + rest が default
- Flow Director (`AUTO`)、optional `BASS` / `DRUMS`（drum-floor soft pocket adapter）
- audio error / late tick / memory pressure は hard fail せず **quiet recovery** へ
- 同じ `seed` + `referenceId` + fader 状態で同じ event stream を返す **deterministic preview**
- central runtime ではない。central rig は `Music`、ambient water は `namima`、rhythm engine は `drum-floor`。

---

## Hard rules（絶対守る）

chill 固有の境界:

1. **generic ambient / continuous pad bed に潰さない**。piano chord + 静寂が default sound。
2. **`PULSE` / `BASS` / `DRUMS` を主役にしない**。すべて off-by-default の低密度レイヤー。
3. **Music SYNC で自動再生しない**。SYNC は metadata-only。構えだけ合わせ、音は人間の `START` まで出さない。
4. **`namima-lab` など他 repo の runtime code を blind copy しない**。artist / repo 参照は production parameter に翻訳する。

共通ルール:

5. 音源 / サンプル / 歌詞 / 録音を repo に追加しない（すべて Tone.js 合成）。
6. dependency を勝手に足さない（CDN pin の Tone.js のみ）。
7. GitHub Actions を勝手に足さない（user 承認必須）。
8. archive / delete / settings 操作は触らない（別承認が必要）。

main runtime ファイル — `index.html`（Quiet Piano Radio）/ `session.html`（Quiet Piano Trio）/
`engine.js`（synthetic piano・bass・Flow Director・public contracts）/ `session.js`（Music SYNC bridge・
trio snapshot・listening score）/ `sw.js`。**大改修は feature branch + PR + 人間レビュー**。

---

## Integrity gate

commit 前に repo root から下記を 0 終了させる:

```bash
node scripts/check-pwa-static.mjs
```

5 repo 一括検証は Music repo root の `node scripts/stack-check.mjs`（`0 BAD` が commit の前提）。

---

## Cache buster discipline

`sw.js` の cache version 変数は **`const VERSION`**（現在 `chill-pwa-v2`）。
local asset は `?v=pwa-N` query を持つ。UI / runtime（`index.html` / `session.html` /
`style.css` / `engine.js` / `session.js`）を変えたら **3 箇所を同期 bump**:

1. 各 HTML / `sw.js` `PRECACHE_URLS` 内の `?v=pwa-N`
2. `sw.js` の `const VERSION` の `-vN`
3. bump 後に `node scripts/check-pwa-static.mjs` で 0 終了を確認

---

## Branch & PR convention

| 状況 | 推奨 |
|---|---|
| docs only（`README.md` / `docs/`） | main 直 push 可 |
| 非 runtime コード（`scripts/` / `exports/` 等） | feature branch + PR |
| runtime・音を変える（`engine.js` / `session.js` / `*.html` / `sw.js` / 音の挙動） | feature branch + PR + 人間レビュー |

作業前に必ず `git pull --ff-only origin main` で最新化してから着手する。

---

## Autonomous development

入口 / 待ち行列 / 記録は `Music/docs/autonomy/`:

- 構造マップ: `Music/docs/autonomy/STACK-INDEX.md`（最初に読む）
- 作業待ち行列: `Music/docs/autonomy/BACKLOG.md`
- セッション台帳: `Music/docs/autonomy/SESSION-LEDGER.md`
- 作業フロー: `Music/docs/autonomy/AUTONOMOUS-RUN.md`

自律ランの安全上限:

- ✅ docs は main 直 push 可
- ✅ 非 runtime コードは feature branch + PR まで（merge は人間）
- ❌ runtime・音の変更は人間レビュー必須
- ❌ 無人 merge は不可
- ❌ GitHub Actions 追加 / dependency 追加 / archive 操作は不可

詳細は `Music/docs/autonomy/AUTONOMOUS-RUN.md`。
