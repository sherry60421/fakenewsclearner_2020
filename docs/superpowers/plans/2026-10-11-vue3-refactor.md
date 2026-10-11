# Vue 3 CDN 完整重構 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將現有的 `index.html` + `main.js` 從 jQuery 手動 DOM 操作完整重構為 Vue 3 CDN 響應式架構，所有資料驅動為 `ref`/`reactive`，模板互動改用 Vue 指令，D3 地圖保留原有邏輯但掛接到 Vue 生命週期。

**Architecture:** 使用 Vue 3 CDN（Global Build），在 `index.html` 的 `<body>` 最外層掛一個 `id="app"` 容器，用 `Vue.createApp()` 初始化單一根 App。所有頁面區塊（Header、Banner、各 section、Footer）都整合進這個 App 的 template，以 `setup()` + Composition API 管理狀態與邏輯。D3 地圖操作不適合 Vue 模板，保留為 `onMounted` 中的命令式程式碼。jQuery 只保留 `nice-select`（用於 `<select>`），其餘 jQuery 操作全部移除。

**Tech Stack:** Vue 3.5.13（CDN Global Build）、D3 v7（ES Module CDN）、topojson-client v3（ES Module CDN）、Bootstrap 5.2.3（本地）、Font Awesome（本地）

**Spec:** 無獨立 spec 檔案，以現有 `index.html` + `js/main.js` 為參考基準。

## Global Constraints

- 部署平台：GitHub Pages（純靜態，不能有 build step）
- Vue 引入方式：CDN `<script>` 標籤，使用 Global Build（`Vue.createApp`），**不使用** ES Module 版本（避免與 `type="importmap"` 衝突）
- D3 / topojson 繼續透過 `importmap` 以 ES Module 引入，在 `main.js` 的 `onMounted` 中執行
- 所有現有功能必須保留：Sticky Header、FAB 浮動選單、Accordion Slider、台灣地圖 hover 互動、stats count-up、scroll reveal
- jQuery 只保留 `$.fn.niceSelect()`，其他 `$()` 操作改為 Vue 等效寫法
- 不新增任何 `.vue` 單檔元件（CDN 模式不支援 SFC 編譯）
- CSS 不修改，class 名稱與結構必須與現有 `main.css` 完全對應

---

## 檔案對照表

| 檔案 | 動作 | 說明 |
|------|------|------|
| `index.html` | 修改 | 整個 `<body>` 內容改為 Vue template，移除 inline JS，加 `id="app"` |
| `js/main.js` | 完全重寫 | 改為 `Vue.createApp({ setup() {...} }).mount('#app')`，D3 邏輯移入 `onMounted` |
| `css/main.css` | 不動 | |
| `js/vendor/*` | 不動 | |

---

## Task 1：整理 HTML 骨架，掛上 Vue 根元素

**Files:**
- Modify: `index.html`

**目標：** 讓 HTML 成為 Vue 可以接管的結構。把所有 `<body>` 內的 HTML 包進 `<div id="app">`，並確保 Vue CDN script 在所有內容之前載入（已在上一步加入 `<head>`）。這個 task 只動結構，不加任何 Vue 指令。

- [ ] **Step 1：確認 Vue CDN 已在 `<head>` 內**

  在 `index.html` 的 `<head>` 確認有這行（上一步已加，再次核對）：
  ```html
  <script src="https://cdn.jsdelivr.net/npm/vue@3.5.13/dist/vue.global.prod.min.js"></script>
  ```

- [ ] **Step 2：在 `<body>` 開頭加 `<div id="app">`，結尾加 `</div>`**

  找到 `<body>` 的第一個 non-comment 子元素（`<!-- Google Tag Manager (noscript) -->`），在它**之後**加上 `<div id="app">`。在最後一個 `<script>` 標籤群**之前**加上 `</div>`，讓所有頁面可見內容包進 `#app`。

  結構如下：
  ```html
  <body>
    <!-- GTM noscript -->
    <noscript>...</noscript>

    <div id="app">
      <!-- header, sections, footer, fab... 全部在這裡 -->
    </div>

    <!-- script tags -->
    <script src="js/vendor/jquery-2.2.4.min.js"></script>
    ...
    <script type="module" src="js/main.js"></script>
  </body>
  ```

- [ ] **Step 3：手動在瀏覽器開啟 `index.html`，確認頁面外觀與改動前相同**

  此步驟不改任何 CSS/JS，外觀不應有任何變化。

---

## Task 2：資料層 — 把所有靜態資料搬進 Vue `setup()`

**Files:**
- Modify: `js/main.js`（完全重寫）

**目標：** 先建立 Vue App 的骨架與資料層，暫時不渲染任何動態模板，確保資料結構正確。

- [ ] **Step 1：清空 `main.js`，寫 Vue App 骨架**

  ```js
  import * as d3 from 'd3';
  import * as topojson from 'topojson-client';

  const { createApp, ref, reactive, onMounted, computed } = Vue;

  createApp({
    setup() {

      // ── 1. Banner 輪播 ──────────────────────────────
      const bannerSlides = ref([
        {
          title: '假新聞清潔劑',
          subtitle: '從每一個人、每一個家庭開始，一起累積社會的資訊韌性，修復彼此的信任，讓下一代也能在更健康的資訊環境中成長。'
        },
        {
          title: '資訊識讀教育',
          subtitle: '提供系統性的媒體識讀課程，培養大眾辨別真假資訊的能力，共同建立更可信賴的資訊生態。'
        },
        {
          title: '一起對抗假新聞',
          subtitle: '匯聚各方力量，透過科技與教育雙管齊下，守護民主社會的資訊自由與真實。'
        },
      ]);
      const currentBannerIndex = ref(0);

      // ── 2. Accordion Slider ─────────────────────────
      const accordionSlides = ref([
        { title: '街頭活動', subtitle: '帶領志工向路人說明假新聞的危害', img: 'https://picsum.photos/id/10/1200/800' },
        { title: '市集擺攤', subtitle: '參加市集，讓群眾更認識整個議題', img: 'https://picsum.photos/id/11/1028/700' },
        { title: '志工培訓', subtitle: '訓練志工，讓更多人能參與我們的行動', img: 'https://picsum.photos/id/12/320/240' },
        { title: '大眾宣講', subtitle: '結合關懷據點、社區大學等單位進行宣講', img: 'https://picsum.photos/id/13/1028/650' },
        { title: '講師培力', subtitle: '從一對一訓練，至親身上台累積經驗', img: 'https://picsum.photos/id/14/1028/750' },
        { title: '教材研發', subtitle: '親自設計的教材，讓群眾深入認識假新聞', img: 'https://picsum.photos/id/15/1028/750' },
      ]);
      const activeSlideIndex = ref(-1);

      // ── 3. 成果統計 ─────────────────────────────────
      const defaultStats = reactive({ events: 950, trainers: 25, volunteers: 210, families: '5萬', label: '' });
      const currentStats = reactive({ ...defaultStats });

      const countyStats = {
        '63000': { events: 280, trainers: 8,  volunteers: 62, families: '1.5萬', label: '臺北市' },
        '65000': { events: 210, trainers: 6,  volunteers: 48, families: '1.2萬', label: '新北市' },
        '68000': { events: 95,  trainers: 3,  volunteers: 21, families: '4000',  label: '桃園市' },
        '10017': { events: 42,  trainers: 2,  volunteers: 11, families: '1800',  label: '基隆市' },
        '10018': { events: 38,  trainers: 1,  volunteers: 8,  families: '1500',  label: '新竹市' },
        '10004': { events: 25,  trainers: 1,  volunteers: 6,  families: '1000',  label: '新竹縣' },
        '10002': { events: 18,  trainers: 1,  volunteers: 5,  families: '800',   label: '宜蘭縣' },
        '66000': { events: 88,  trainers: 2,  volunteers: 19, families: '3500',  label: '臺中市' },
        '10005': { events: 22,  trainers: 1,  volunteers: 5,  families: '900',   label: '苗栗縣' },
        '10007': { events: 20,  trainers: 1,  volunteers: 4,  families: '800',   label: '彰化縣' },
        '10008': { events: 15,  trainers: 1,  volunteers: 4,  families: '600',   label: '南投縣' },
        '10009': { events: 12,  trainers: 1,  volunteers: 3,  families: '500',   label: '雲林縣' },
        '67000': { events: 75,  trainers: 2,  volunteers: 17, families: '3000',  label: '高雄市' },
        '64000': { events: 60,  trainers: 2,  volunteers: 14, families: '2500',  label: '臺南市' },
        '10010': { events: 18,  trainers: 1,  volunteers: 4,  families: '700',   label: '嘉義縣' },
        '10020': { events: 14,  trainers: 1,  volunteers: 3,  families: '600',   label: '嘉義市' },
        '10013': { events: 10,  trainers: 1,  volunteers: 3,  families: '400',   label: '屏東縣' },
        '10015': { events: 8,   trainers: 1,  volunteers: 2,  families: '300',   label: '花蓮縣' },
        '10014': { events: 6,   trainers: 1,  volunteers: 2,  families: '250',   label: '臺東縣' },
        '10016': { events: 5,   trainers: 1,  volunteers: 1,  families: '200',   label: '澎湖縣' },
        '09020': { events: 4,   trainers: 1,  volunteers: 1,  families: '150',   label: '金門縣' },
        '09007': { events: 3,   trainers: 1,  volunteers: 1,  families: '100',   label: '連江縣' },
      };

      // ── 4. 文章卡片 ─────────────────────────────────
      const newsCards = ref([
        { id: 1, img: 'https://picsum.photos/id/11/1028/700', title: 'Card title', text: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.', link: '#' },
        { id: 2, img: 'https://picsum.photos/id/20/1028/700', title: 'Card title', text: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.', link: '#' },
        { id: 3, img: 'https://picsum.photos/id/42/1028/700', title: 'Card title', text: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.', link: '#' },
      ]);

      // ── 5. UI 狀態 ──────────────────────────────────
      const isSticky = ref(false);
      const isFabVisible = ref(false);
      const isFabOpen = ref(false);
      const isNavOpen = ref(false);

      return {
        bannerSlides, currentBannerIndex,
        accordionSlides, activeSlideIndex,
        defaultStats, currentStats, countyStats,
        newsCards,
        isSticky, isFabVisible, isFabOpen, isNavOpen,
      };
    }
  }).mount('#app');
  ```

- [ ] **Step 2：在瀏覽器開啟 `index.html`**

  此時 Vue App 已 mount，但 HTML 模板還沒改，頁面外觀應與原來相同（Vue 不會破壞現有 HTML，只是 `setup()` 在背景跑）。

  開啟 DevTools Console，應無 JS 錯誤。若出現 `Vue is not defined`，檢查 `<head>` 內 Vue CDN `<script>` 是否在 `main.js` 載入之前。

---

## Task 3：Header 與 FAB 浮動選單的 Vue 互動

**Files:**
- Modify: `index.html`（header、fab 區塊）
- Modify: `js/main.js`（加入 scroll 監聽、fab/nav 方法）

**目標：** 把 sticky header、手機版漢堡選單、FAB 浮動選單從 jQuery 改為 Vue 響應式。

- [ ] **Step 1：在 `main.js` `setup()` 加入 scroll 監聽與 nav/fab 方法**

  在 `return` 之前加入：
  ```js
  // Scroll 監聽：sticky header + FAB 可見性
  function onScroll() {
    const anchor = document.getElementById('who-are-we');
    if (!anchor) return;
    const triggerY = anchor.getBoundingClientRect().top + window.scrollY;
    isSticky.value = window.scrollY >= triggerY;
    if (window.innerWidth <= 767) {
      if (window.scrollY >= triggerY) {
        isFabVisible.value = true;
      } else {
        isFabVisible.value = false;
        isFabOpen.value = false;
      }
    }
  }

  function toggleFab() {
    isFabOpen.value = !isFabOpen.value;
  }

  function closeFabAndScroll(href) {
    isFabOpen.value = false;
    setTimeout(() => {
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }, 280);
  }

  function toggleNav() {
    isNavOpen.value = !isNavOpen.value;
  }

  function smoothScroll(href) {
    if (!href || href === '' || href === '#') return;
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  }

  onMounted(() => {
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onScroll);
    onScroll();
    // nice-select（jQuery，保留）
    if (typeof $ !== 'undefined') $('select').niceSelect();
  });
  ```

  並在 `return {}` 中加入：`onScroll, toggleFab, closeFabAndScroll, toggleNav, smoothScroll`

- [ ] **Step 2：修改 `index.html` 的 `<header>` 區塊**

  把原有的 `<header class="default-header">` 改為：
  ```html
  <header :class="['default-header', { sticky: isSticky }]">
    <div class="container-fluid">
      <div class="header-wrap">
        <div class="header-top d-flex justify-content-between align-items-center">
          <div class="logo">
            <a href="index.html"><img src="img/logo.png" alt="假新聞清潔劑 Logo"></a>
          </div>
          <div class="main-menubar d-flex align-items-center">
            <nav :class="{ open: isNavOpen }">
              <a href="#who-are-we" @click.prevent="smoothScroll('#who-are-we')">我們是誰</a>
              <a href="#what-we-do" @click.prevent="smoothScroll('#what-we-do')">邀請/合作</a>
              <a href="#support-us" @click.prevent="smoothScroll('#support-us')">加入我們</a>
              <a href="#support-us" @click.prevent="smoothScroll('#support-us')">支持我們</a>
              <a href="">Social Medias</a>
            </nav>
            <div class="menu-bar d-lg-none" @click="toggleNav">
              <span :class="isNavOpen ? 'lnr lnr-cross' : 'lnr lnr-menu'"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
  ```

- [ ] **Step 3：修改 FAB 浮動選單區塊**

  把原有的 `<div id="mobile-fab-wrap">` 改為：
  ```html
  <div id="mobile-fab-wrap"
       :class="{ 'is-visible': isFabVisible, 'fab-open': isFabOpen }">
    <div id="mobile-fab-menu" role="navigation" aria-label="浮動導覽選單">
      <a href="#who-are-we" @click.prevent="closeFabAndScroll('#who-are-we')">我們是誰</a>
      <a href="#what-we-do" @click.prevent="closeFabAndScroll('#what-we-do')">行動</a>
      <a href="#achievement" @click.prevent="closeFabAndScroll('#achievement')">成果</a>
      <a href="#support-us" @click.prevent="closeFabAndScroll('#support-us')">支持我們</a>
      <a href="">Social Medias</a>
    </div>
    <button id="mobile-fab"
            :aria-expanded="String(isFabOpen)"
            aria-label="開啟選單"
            aria-controls="mobile-fab-menu"
            @click="toggleFab">
      <i :class="isFabOpen ? 'lnr lnr-cross' : 'lnr lnr-menu'" aria-hidden="true"></i>
    </button>
  </div>
  ```

- [ ] **Step 4：移除原本的 jQuery sticky/FAB 相關程式碼**

  在 `main.js` 中，舊版 `$(document).ready()` 裡的以下區塊已不再需要，在後續 Task 5 完全清除 jQuery ready block 時一併處理。

- [ ] **Step 5：驗證**

  瀏覽器開啟，捲動頁面確認：
  - `#who-are-we` 以下 header 出現 `sticky` class
  - 手機寬度（DevTools 切換）捲動後 FAB 按鈕浮現
  - 點 FAB 按鈕選單展開/收合
  - header nav 的漢堡按鈕展開/收合

---

## Task 4：Banner 輪播改用 Vue 響應式

**Files:**
- Modify: `index.html`（banner section）
- Modify: `js/main.js`（加入 banner 自動輪播 timer）

**目標：** Bootstrap Carousel 的輪播改為 Vue 響應式，移除 `data-bs-*` 屬性依賴。

- [ ] **Step 1：在 `main.js` `setup()` 加入 banner 方法**

  在 `return` 之前加入：
  ```js
  // Banner 輪播自動播放
  function nextBanner() {
    currentBannerIndex.value = (currentBannerIndex.value + 1) % bannerSlides.value.length;
  }
  function goToBanner(index) {
    currentBannerIndex.value = index;
  }

  onMounted(() => {
    // 自動輪播（每 5 秒）
    setInterval(nextBanner, 5000);
    // ... （其他 onMounted 內容在 Task 2 已加入）
  });
  ```

  並在 `return {}` 加入：`nextBanner, goToBanner`

  > 注意：`onMounted` 應合併為同一個，不要重複呼叫兩次。

- [ ] **Step 2：修改 `index.html` 的 banner section**

  把 `<section class="banner-area relative">` 的輪播區塊改為：
  ```html
  <section class="banner-area relative">
    <div class="overlay overlay-bg"></div>
    <div class="container">
      <div class="row fullscreen align-items-center justify-content-center">
        <div class="col-lg-12">
          <div class="carousel slide">
            <!-- 指示點 -->
            <div class="carousel-indicators">
              <button
                v-for="(slide, index) in bannerSlides"
                :key="index"
                type="button"
                :class="{ active: currentBannerIndex === index }"
                :aria-current="currentBannerIndex === index ? 'true' : undefined"
                :aria-label="'Slide ' + (index + 1)"
                @click="goToBanner(index)"
              ></button>
            </div>
            <!-- 輪播內容 -->
            <div class="carousel-inner text-center">
              <div
                v-for="(slide, index) in bannerSlides"
                :key="index"
                :class="['carousel-item', { active: currentBannerIndex === index }]"
              >
                <div class="banner-content">
                  <h1>{{ slide.title }}</h1>
                  <p class="text-white mb-40">{{ slide.subtitle }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  ```

- [ ] **Step 3：驗證**

  瀏覽器開啟，確認 banner 每 5 秒自動切換，點指示點可手動切換。

---

## Task 5：Accordion Slider 改用 Vue

**Files:**
- Modify: `index.html`（`#what-we-do` section）
- Modify: `js/main.js`（移除 `AccordionSlider` class，加 Vue 方法）

**目標：** 移除 `AccordionSlider` 類別，改用 Vue `v-for` 渲染 + `activeSlideIndex` 狀態。

- [ ] **Step 1：在 `main.js` `setup()` 加入 accordion 方法**

  在 `return` 之前加入：
  ```js
  function setActiveSlide(index) {
    activeSlideIndex.value = activeSlideIndex.value === index ? -1 : index;
  }

  function nextAccordionSlide() {
    const next = activeSlideIndex.value === -1
      ? 0
      : (activeSlideIndex.value + 1) % accordionSlides.value.length;
    setActiveSlide(next);
  }

  function prevAccordionSlide() {
    const prev = activeSlideIndex.value === -1
      ? accordionSlides.value.length - 1
      : (activeSlideIndex.value - 1 + accordionSlides.value.length) % accordionSlides.value.length;
    setActiveSlide(prev);
  }
  ```

  在 `onMounted` 中加入鍵盤監聽：
  ```js
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') prevAccordionSlide();
    if (e.key === 'ArrowRight') nextAccordionSlide();
  });
  ```

  在 `return {}` 加入：`setActiveSlide, nextAccordionSlide, prevAccordionSlide`

- [ ] **Step 2：修改 `index.html` 的 `#what-we-do` section**

  ```html
  <section id="what-we-do">
    <div class="container">
      <h2 class="text-align-center">我們在做什麼</h2>
    </div>
    <div class="accordion-wrap">
      <div class="accordion-slider">
        <div
          v-for="(slide, index) in accordionSlides"
          :key="index"
          :class="['slide', { active: activeSlideIndex === index }]"
          :style="{ backgroundImage: 'url(\'' + slide.img + '\')' }"
          @mouseenter="setActiveSlide(index)"
        >
          <div class="slide-content">
            <div class="slide-title">{{ slide.title }}</div>
            <p class="slide-subtitle">{{ slide.subtitle }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
  ```

- [ ] **Step 3：移除 `main.js` 中的 `AccordionSlider` class 與 `new AccordionSlider()` 呼叫**

- [ ] **Step 4：驗證**

  hover 各張 slide 確認展開，鍵盤 ← → 確認切換。

---

## Task 6：文章卡片改用 `v-for` 渲染

**Files:**
- Modify: `index.html`（`#news` section）

**目標：** 把硬編碼的 3 張卡片改為 `v-for` 渲染，日後只需修改 `newsCards` 資料。

- [ ] **Step 1：修改 `index.html` 的 `#news` section**

  ```html
  <section id="news">
    <div class="container">
      <h2>文章＆報導</h2>
      <div class="row news-card-row">
        <div
          v-for="card in newsCards"
          :key="card.id"
          class="col-12 col-md-4 news-card-col"
        >
          <div class="card news-card">
            <div class="news-card-img-wrap">
              <img :src="card.img" class="card-img-top" alt="文章封面圖">
            </div>
            <div class="card-body">
              <h5 class="card-title">{{ card.title }}</h5>
              <p class="card-text">{{ card.text }}</p>
              <a :href="card.link" class="btn news-btn">閱讀更多</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  ```

- [ ] **Step 2：驗證**

  確認 3 張卡片正常顯示，圖片、標題、連結正確。

---

## Task 7：台灣地圖 D3 整合至 Vue `onMounted`

**Files:**
- Modify: `js/main.js`（D3 地圖邏輯移入 `onMounted`，hover 改呼叫 Vue 的 `updateStats`）

**目標：** 地圖 hover 更新成果數字，改為更新 Vue 的 `currentStats` reactive 物件，而非直接操作 DOM。

- [ ] **Step 1：在 `main.js` `setup()` 加入 `updateStats` 函式**

  ```js
  function updateStats(data) {
    Object.assign(currentStats, data);
  }

  function resetStats() {
    Object.assign(currentStats, defaultStats);
  }
  ```

  在 `return {}` 加入：`currentStats, updateStats, resetStats`

- [ ] **Step 2：把 D3 地圖邏輯全部移入 `onMounted`**

  將 `main.js` 最上層的 D3 程式碼（`const topo = await d3.json(...)` 到地圖 render 結束）全部移入 `onMounted(async () => { ... })`，並把地圖 hover 的 `updateStats` 呼叫改為：

  ```js
  .on('mouseenter', function (event, d) {
    d3.select(this).attr('fill', '#f5204b');
    const stats = countyStats[d.properties.id];
    if (stats) updateStats(stats);
  })
  .on('mouseleave', function () {
    d3.select(this).attr('fill', '#e8e8e8');
    resetStats();
  });
  ```

  移除原本的 `updateStats` 函式（那個是直接操作 DOM 的版本）。

- [ ] **Step 3：修改 `index.html` 的 `#achievement` section，數字改用 Vue 插值**

  把原本的：
  ```html
  <div class="number" data-stat="events">950</div>
  ```
  改為：
  ```html
  <div class="number">{{ currentStats.events }}</div>
  ```

  四個數字欄位依序：
  - `data-stat="events"` → `{{ currentStats.events }}`
  - `data-stat="trainers"` → `{{ currentStats.trainers }}`
  - `data-stat="volunteers"` → `{{ currentStats.volunteers }}`
  - `data-stat="families"` → `{{ currentStats.families }}`

  移除所有 `data-stat` 屬性。

- [ ] **Step 4：確認 `currentStats` label 欄位可顯示（選用）**

  如果想在地圖旁顯示目前 hover 的縣市名稱，可在 `#achievement` 適當位置加：
  ```html
  <p v-if="currentStats.label" class="county-label">{{ currentStats.label }}</p>
  ```

- [ ] **Step 5：驗證**

  hover 台灣地圖各縣市，確認左欄數字即時更新；mouse leave 後回到預設總計。

---

## Task 8：Scroll Reveal + Stats Count-up 整合至 Vue

**Files:**
- Modify: `js/main.js`（scroll reveal 邏輯移入 `onMounted`）

**目標：** scroll reveal 與 count-up 動畫從自執行 IIFE 改為在 `onMounted` 中執行，確保 Vue DOM 渲染完成後才附加 observer。

**注意：** count-up 動畫的觸發邏輯原本是監聽 DOM 元素的 `textContent`。現在 `currentStats` 是 reactive，數字由 Vue 管理。count-up 改為只在頁面初次進入 `#achievement` viewport 時執行一次，動畫結束後 Vue 接管後續更新（不再 count-up，直接切換數字）。

- [ ] **Step 1：把 scroll reveal IIFE 移入 `onMounted`**

  把 `main.js` 最底部的 `(function () { ... })()` 整個移入 `onMounted`，刪除原本的 `(function () {` 開頭和最後的 `})();`。

- [ ] **Step 2：修改 count-up，改為使用初始預設數字的 count-up**

  count-up 的目標值從 `el.textContent.trim()` 改為從 `defaultStats` 取得：
  ```js
  const statKeys = ['events', 'trainers', 'volunteers', 'families'];
  const statEls = statsSection.querySelectorAll('.number');
  statEls.forEach((el, i) => {
    const key = statKeys[i];
    const raw = String(defaultStats[key]);
    const match = raw.match(/^(\d+)(.*)/);
    if (match) {
      const num = parseInt(match[1], 10);
      const suffix = match[2];
      setTimeout(() => countUp(el, num, suffix, 1400, key), i * 180);
    }
  });
  ```

  修改 `countUp` 函式簽名，加入 `key` 參數，動畫結束後更新 `currentStats[key]`，以便 Vue 接管：
  ```js
  function countUp(el, target, suffix, duration, key) {
    var start = performance.now();
    function step(now) {
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 4);
      var val = Math.round(eased * target);
      el.textContent = val + suffix;        // 動畫期間直接寫 DOM
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        // 動畫結束，同步回 Vue reactive
        if (key) currentStats[key] = target + suffix !== suffix ? val : defaultStats[key];
      }
    }
    requestAnimationFrame(step);
  }
  ```

  > 因 `families` 是 `'5萬'`（非純數字），count-up 跳過，直接顯示。

- [ ] **Step 3：驗證**

  首次捲到 `#achievement`，數字有 count-up 動畫；接著 hover 地圖，數字即時切換。

---

## Task 9：清除 jQuery ready block 與殘留 DOM 操作

**Files:**
- Modify: `js/main.js`（移除 `$(document).ready()`、`$('.fullscreen').css(...)` 等）

**目標：** 所有 jQuery 操作已被 Vue 取代，只保留 `$('select').niceSelect()`。

- [ ] **Step 1：移除 `$(document).ready()` 整個 block**

  確認以下功能已在前面 Task 中被 Vue 取代後，刪除：
  - `$('.fullscreen').css('height', ...)` → 改用 CSS `min-height: 100vh`（在 `main.css` 已有 `.fullscreen` 樣式，確認後直接刪除這行）
  - `updateStickyHeader` + scroll listener → Task 3 的 Vue `onScroll` 取代
  - FAB 相關 `$fabBtn.on('click', ...)` → Task 3 的 Vue `toggleFab` 取代
  - `.menu-bar` click → Task 3 的 Vue `toggleNav` 取代
  - 平滑捲動 `document.querySelectorAll('a[href^="#"]')` → Task 3 的 `smoothScroll` 取代
  - `new AccordionSlider()` → Task 5 取代

  **唯一保留** 的 jQuery 程式碼：
  ```js
  onMounted(() => {
    // ...
    if (typeof $ !== 'undefined') $('select').niceSelect();
  });
  ```

- [ ] **Step 2：確認 `import` 語句正確**

  `main.js` 頂部應只有：
  ```js
  import * as d3 from 'd3';
  import * as topojson from 'topojson-client';

  const { createApp, ref, reactive, onMounted } = Vue;
  ```

- [ ] **Step 3：全頁驗證**

  在瀏覽器開啟 `index.html`，逐一確認：
  - [ ] Banner 輪播自動播放 + 手動切換
  - [ ] Sticky header 捲動觸發
  - [ ] FAB 手機版浮現與展開
  - [ ] Header nav 漢堡選單開關
  - [ ] Accordion slider hover 與鍵盤操作
  - [ ] 台灣地圖 hover 數字更新
  - [ ] Stats count-up 動畫
  - [ ] Scroll reveal 動畫
  - [ ] 文章卡片正常顯示
  - [ ] DevTools Console 無 JS 錯誤

- [ ] **Step 4：commit**

  ```bash
  git add index.html js/main.js
  git commit -m "refactor: 完整重構為 Vue 3 CDN 架構"
  ```

---

## 附錄：已知潛在問題與處理方式

| 問題 | 說明 | 處理方式 |
|------|------|----------|
| `type="importmap"` 與 Vue CDN 衝突 | Vue CDN 是 Global Build，不走 importmap | 確認 Vue `<script>` 在 `importmap` 之前，兩者不衝突 |
| `main.js` 有 top-level `await` | `await d3.json(...)` 需要 `type="module"` | 已是 module，移入 `onMounted(async () => {...})` 後改為 async function 即可 |
| count-up 與 Vue reactive 同時操作同一 DOM | 動畫期間直接寫 DOM，Vue 在下一個 tick 可能蓋掉 | count-up 執行期間暫時用 `el.textContent` 直接寫，結束後同步 reactive；Vue 的 template 綁定在動畫結束後才生效 |
| `$('.fullscreen').css('height', ...)` 移除後版面跑掉 | 若 CSS 裡 `.fullscreen` 沒有 `min-height: 100vh` 則需補 | 先確認 `main.css` 再決定是否補 CSS |
