# 聲音球體 Sound Spheres · Real Recordings + Inner Voices v3

義守大學電影與電視學系陳嘉暐老師製作。
Sound Spheres 概念原作者：David Sonnenschein。六個層次依課程教材互動改編。

公開網站：https://weisfx0705.github.io/sound-spheres/

## 執行與發布

純 HTML/CSS/JavaScript + 自帶 MP3。無建置、無後端、無執行期金鑰、無外部 CDN。透過 HTTP/HTTPS 使用；直接 file:// 開啟不能保證 fetch 音檔可用。

本機：`python3 -m http.server 8765`，開啟 http://localhost:8765。

GitHub Pages：將 index.html、resources.html、style.css、app.js、audio-engine.js、inner-voices.js、audio/ 全資料夾及 .nojekyll 提交到 main 根目錄。Settings → Pages → Deploy from a branch → main / (root)。專案已設定此方式，push 後自動部署。所有資源使用相對路徑，支援專案子路徑。

## v3 的行為

- 開始體驗先載入五段不同聲線的 AI 內在碎念：待辦太多、別人怎麼想、還不夠好、日常小混亂、明天怎麼辦。逐一點「先放下」或「一鍵安放全部」，全部關閉後才解鎖外層、場景、引導與真實環境模式。暫停不解鎖；可重新測試。
- 解鎖後，「先聽完整聲景」或點選任一場景卡，會立即開始載入並播放該地點的完整錄音混音。切換不再強制回到靜音層次。
- 入口 I THINK 是五段聲音交疊的互動小練習；全部關閉後，再選 I THINK 則保持安靜。
- I AM 至 I DON'T KNOW 以真實錄音逐層展開；目前層次最清楚，較內層輕聲保留。
- 「只聽這一層」關閉其他聲音，便於教學比較。
- 六分鐘引導每層一分鐘；暫停與背景頁面不計時。
- 預設音量 70%，逐檔做響度處理與循環接點，混音端使用動態壓縮與柔性峰值限制。音量表來自實際音訊分析，並非裝飾動畫。
- 顯示音訊載入狀態，載入可取消、失敗可重試；快速換場景時只有最後一次選擇生效。播放需瀏覽器使用者手勢。
- 「聆聽真實環境」停止音訊，不存取麥克風。
- 筆記以場景與層次分別儲存在 localStorage，可匯出 Markdown。

## 音效與教學界線

14 個 Freesound 真實錄音來源，剪成 17 段循環音訊，總檔案約 10 MB。原始公開 HQ MP3 試聽版本下載後進行剪輯、高通 45 Hz、0.4 秒循環交叉淡化、兩階段 loudnorm 校正並編碼為 44.1 kHz / 192 kbps 立體聲 MP3。處理目標 −18 LUFS / −2 dBTP；實測個別檔案 −20.66 至 −17.96 LUFS，最高真峰值 −1.12 dBTP。MP3 編碼及瞬態特性可能使結果與目標略有差異。

全部移除舊版的振盪器與噪聲合成。台北街道與阿里山鳥蟲溪流具有台灣現場來源；郵局底景來自芬蘭。所有場景皆為多素材聲景重構，不宣稱在同一地點同一時間錄製。音樂廳是開演前樂團調音；演唱會是謝幕掌聲與人群，沒有商業歌曲或完整交響曲。

I SEE / I KNOW 是看見與辨認聲源的關係，不單靠錄音本身決定。網站以文字情境設定視點。I DON'T KNOW 保留學習者的未知；如果認出來源，可以改歸 I KNOW。

## 素材署名與再利用

`resources.html` 可逐段試聽並查閱原作者、來源、授權。`audio/credits.json` 保存原始標題、作者、Freesound 頁面、下載來源、授權連結、剪輯區段、處理方法與測量。

akx 的 Post Office Ambience 為 CC BY 4.0，使用或再散布必須署名、連回來源與授權並說明修改；其餘來源為 CC0 1.0。這些授權描述音效素材，不代表錄音者背書網站。Gemini 輔助真實音效內容篩選，並另外生成五段 I THINK 語音。五段原創課程獨白不是 Freesound 素材，不套用外在錄音的 CC 授權。實際模型、聲線、完整風格指示、逐字稿與響度測量均記錄於 audio/inner-voices.json，並在 Resources 頁提供單段試聽。
