# 聲音球體 Sound Spheres

依據使用者課程教材、David Sonnenschein 的 Sound Spheres 概念製作的繁體中文互動聆聽練習。純 HTML / CSS / JavaScript，無建置步驟、無外部依賴、無金鑰。

## GitHub Pages 發布

1. 建立 GitHub repository，將本資料夾內的 `index.html`、`style.css`、`app.js`、`resources.html`、`.nojekyll` 放到 repository 根目錄並提交。
2. Settings → Pages → Build and deployment，選 Deploy from a branch。
3. 選 main 分支、/(root)，儲存。等待 GitHub 提供發布網址。

所有資源採相對路徑，支援專案子路徑。亦可直接開啟 index.html；正式使用建議透過 HTTPS 網站，以取得穩定的瀏覽器儲存行為。

## 操作

按「開始聆聽」啟用音訊。I THINK 刻意保留安靜；選擇 I AM 後，才逐層加入呼吸示意、接觸、可見、熟悉及未知聲音。外層保留較輕的內層聲音。每層均可自由選擇；六分鐘引導每層停留一分鐘。切換場景會返回 I THINK。頁面進入背景自動暫停。

五種場景為 Web Audio 原創程序合成的藝術示意，並非臺灣實地錄音、真人呼吸、真正樂團或語音。郵局有印章與紙張示意，戶外有鳥音與車流，演唱會有電子節拍，音樂廳有延長和弦，森林有交替腳步、鳥音及溪流質感。立體聲聲像提供左右位置感，並非實測雙耳空間錄音。「I SEE」與「I KNOW」依聆聽者是否看見／辨認聲源區分，畫面與文案提供情境設定，不宣稱只靠音訊能判定層次。

「真實環境」模式關閉合成聲景，供聆聽所在空間；不存取麥克風。筆記按場景與層次分別儲存在 localStorage，可匯出 Markdown。無追蹤、無上傳。清除瀏覽器資料會移除筆記。

視覺使用 CSS 原創抽象場景，無外部圖片或字型。尊重 prefers-reduced-motion、具備鍵盤焦點與原生對話框。
