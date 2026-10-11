Template Design Credit By Colorlib
Licence: CC BY 3.0

Don't use scss, Use css.

## 本機開發

因為 `js/main.js` 使用 ES Module（`import`）語法，無法直接用瀏覽器開啟 `file://`，需要透過本地 HTTP server 執行。

**方法一：npx serve（需要 Node.js）**

```bash
npx serve .
```

**方法二：Python**

```bash
python3 -m http.server 8080
```

啟動後開啟瀏覽器，前往 `http://localhost:8080`。

**方法三：VS Code / Kiro Live Server 套件**

安裝 Live Server 延伸套件後，對 `index.html` 按右鍵 → "Open with Live Server"，存檔時會自動 reload。