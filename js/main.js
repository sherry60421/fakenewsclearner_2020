import * as d3 from 'd3';
import * as topojson from 'topojson-client';

const { createApp, ref, reactive, onMounted, computed } = Vue;
const { createVuetify } = Vuetify;

const vuetify = createVuetify();

createApp({
  setup() {

    // ── Banner 輪播 ──────────────────────────────────────────────────
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

    // ── Accordion Slider ─────────────────────────────────────────────
    const accordionSlides = ref([
      { title: '街頭活動',   subtitle: '帶領志工向路人說明假新聞的危害',       img: 'img/street.jpg' },
      { title: '市集擺攤',   subtitle: '參加市集，讓群眾更認識整個議題',       img: 'img/market.jpeg' },
      { title: '志工培訓',   subtitle: '訓練志工，讓更多人能參與我們的行動',   img: 'img/volunteer.jpg'  },
      { title: '大眾宣講',   subtitle: '結合關懷據點、社區大學等單位進行宣講', img: 'img/lecture.jpg' },
      { title: '講師培力',   subtitle: '從一對一訓練，至親身上台累積經驗',     img: 'img/teacher2.jpg' },
      { title: '教材研發',   subtitle: '親自設計的教材，讓群眾深入認識假新聞', img: 'https://picsum.photos/id/15/1028/750' },
    ]);
    const activeSlideIndex = ref(-1);

    // ── 成果統計 ─────────────────────────────────────────────────────
    const defaultStats = { events: 950, trainers: 25, volunteers: 210, families: '5萬', label: '' };
    const currentStats = reactive({ ...defaultStats });

    const countyStats = {
      // 北部
      '63000': { events: 280, trainers: 8,  volunteers: 62, families: '1.5萬', label: '臺北市' },
      '65000': { events: 210, trainers: 6,  volunteers: 48, families: '1.2萬', label: '新北市' },
      '68000': { events: 95,  trainers: 3,  volunteers: 21, families: '4000',  label: '桃園市' },
      '10017': { events: 42,  trainers: 2,  volunteers: 11, families: '1800',  label: '基隆市' },
      '10018': { events: 38,  trainers: 1,  volunteers: 8,  families: '1500',  label: '新竹市' },
      '10004': { events: 25,  trainers: 1,  volunteers: 6,  families: '1000',  label: '新竹縣' },
      '10002': { events: 18,  trainers: 1,  volunteers: 5,  families: '800',   label: '宜蘭縣' },
      // 中部
      '66000': { events: 88,  trainers: 2,  volunteers: 19, families: '3500',  label: '臺中市' },
      '10005': { events: 22,  trainers: 1,  volunteers: 5,  families: '900',   label: '苗栗縣' },
      '10007': { events: 20,  trainers: 1,  volunteers: 4,  families: '800',   label: '彰化縣' },
      '10008': { events: 15,  trainers: 1,  volunteers: 4,  families: '600',   label: '南投縣' },
      '10009': { events: 12,  trainers: 1,  volunteers: 3,  families: '500',   label: '雲林縣' },
      // 南部
      '67000': { events: 75,  trainers: 2,  volunteers: 17, families: '3000',  label: '高雄市' },
      '64000': { events: 60,  trainers: 2,  volunteers: 14, families: '2500',  label: '臺南市' },
      '10010': { events: 18,  trainers: 1,  volunteers: 4,  families: '700',   label: '嘉義縣' },
      '10020': { events: 14,  trainers: 1,  volunteers: 3,  families: '600',   label: '嘉義市' },
      '10013': { events: 10,  trainers: 1,  volunteers: 3,  families: '400',   label: '屏東縣' },
      // 東部 & 外島
      '10015': { events: 8,   trainers: 1,  volunteers: 2,  families: '300',   label: '花蓮縣' },
      '10014': { events: 6,   trainers: 1,  volunteers: 2,  families: '250',   label: '臺東縣' },
      '10016': { events: 5,   trainers: 1,  volunteers: 1,  families: '200',   label: '澎湖縣' },
      '09020': { events: 4,   trainers: 1,  volunteers: 1,  families: '150',   label: '金門縣' },
      '09007': { events: 3,   trainers: 1,  volunteers: 1,  families: '100',   label: '連江縣' },
    };

    // ── 文章卡片 ─────────────────────────────────────────────────────
    const newsCards = ref([
      {
        id: 1, img: 'https://picsum.photos/id/11/1028/700', date: '2026/11/08（日）', place: '台北市大安區 龍安社區關懷據點',
        title: '社區講座：長輩也能學會的查證小技巧',
        text: '走進社區關懷據點，用生活中最常見的 LINE 謠言當教材，陪長輩一起練習「先查再傳」。',
        content: [
          '長輩的 LINE 群組裡，每天都有大量健康偏方、政策謠言與詐騙訊息流傳。本次講座以長輩實際收過的訊息為教材，用問答與小遊戲的方式，帶大家認識謠言常見的套路。',
          '現場會示範如何用關鍵字搜尋、比對新聞來源，以及使用查證機器人確認訊息真偽。講座結束後，志工也會留下來協助長輩在手機上設定查證工具，讓學到的方法回家就能用。',
          '活動免費參加，歡迎社區長輩與家屬一同出席。',
        ],
      },
      {
        id: 2, img: 'https://picsum.photos/id/20/1028/700', date: '2026/11/15（日）', place: '台中市第二市場',
        title: '市集擺攤：菜價謠言大解密',
        text: '在傳統市場設置互動攤位，以菜價、食安謠言為題，和攤商與顧客聊聊資訊從哪裡來。',
        content: [
          '「颱風過後菜價要翻三倍」、「某某食材吃了會致癌」——這些消息在市場裡口耳相傳，卻很少有人追問來源。',
          '攤位準備了「真假消息翻翻卡」互動遊戲，民眾可以挑戰判斷訊息真偽，完成挑戰即可獲得協會設計的識讀小卡。我們希望透過輕鬆的對話，讓更多人在日常生活中多一分懷疑、多一步查證。',
        ],
      },
      {
        id: 3, img: 'https://picsum.photos/id/42/1028/700', date: '2026/11/21 起，每週六下午', place: '台北市中正區 協會辦公室',
        title: '種子志工培訓：第六屆開始招生',
        text: '想把資訊識讀帶回自己的社區嗎？第六屆種子志工培訓課程正式開放報名。',
        content: [
          '課程共四堂，內容涵蓋假訊息類型與傳播機制、與不同立場的人溝通的技巧、教案演練與試講。',
          '結訓後可跟著資深講師到社區實地宣講，累積經驗後也能獨立帶領活動。不需任何相關背景，只要願意傾聽與分享，都歡迎加入我們。',
        ],
      },
      {
        id: 4, img: 'https://picsum.photos/id/48/1028/700', date: '2026/11/27（五）', place: '新北市板橋區 某國中',
        title: '校園宣講：國中生的媒體識讀第一課',
        text: '和老師合作設計課堂活動，帶學生拆解短影音與網紅貼文背後的資訊來源。',
        content: [
          '國中生每天接觸大量短影音與社群貼文，卻不一定知道內容是誰做的、為什麼做。本次與輔導老師合作，設計一堂兩節課的識讀課程。',
          '課堂中學生將分組拆解熱門影片，找出其中的情緒操作、斷章取義與業配痕跡，並練習用自己的話說明判斷依據。',
        ],
      },
      {
        id: 5, img: 'https://picsum.photos/id/60/1028/700', date: '2026/12/05（六）', place: '高雄市立圖書館總館',
        title: '圖書館講座：AI 生成圖片怎麼辨識',
        text: '從近期流傳的假照片出發，介紹辨識 AI 生成內容的幾個簡單觀察重點。',
        content: [
          'AI 生成的圖片越來越逼真，災難現場、名人合照都可能是假的。講座將從近期在社群上流傳的實際案例出發，說明這些圖片如何被製造與散播。',
          '講師會介紹幾個一般人也能上手的觀察重點，例如手指與文字細節、光影是否合理，以及反向搜尋圖片來源的方法。',
        ],
      },
      {
        id: 6, img: 'https://picsum.photos/id/180/1028/700', date: '2026/12/12（六）', place: '台南市 社區大學',
        title: '講師培力工作坊：上台前的最後一哩路',
        text: '由資深講師帶領新進講師試講與回饋，練習如何回應現場聽眾的提問。',
        content: [
          '從志工到講師，最大的挑戰往往是面對現場的各種提問與質疑。工作坊將由資深講師分享實戰經驗，並安排新進講師輪流試講。',
          '每位試講者都會獲得一對一回饋，並練習在立場不同的聽眾面前，維持傾聽與尊重的對話態度。',
        ],
      },
    ]);
    const isMoreCardsOpen = ref(false);
    const isActivityOpen = ref(false);
    const activeActivity = ref(null);
    function openActivity(card) {
      activeActivity.value = card;
      isActivityOpen.value = true;
    }

    // ── 文章＆報導列表 ───────────────────────────────────────────────
    const articles = ref([
      {
        id: 1, date: '2026-10-18', source: '公視新聞網',
        title: '長輩群組謠言多？假新聞清潔劑走進社區，教阿公阿嬤「先查再傳」',
        content: [
          '假新聞清潔劑志工團隊本週走訪台北市多個社區關懷據點，以生活化的案例帶領長輩認識常見的網路謠言類型。',
          '志工表示，長輩最常收到的是健康偏方與詐騙訊息，透過「先查證、再轉傳」的口訣，希望讓長輩養成停一下、想一下的習慣。',
        ],
      },
      {
        id: 2, date: '2026-10-09', source: '天下雜誌',
        title: '對話比打臉更有效：一群志工如何修補資訊時代的信任裂痕',
        content: [
          '在立場日益極化的社會中，假新聞清潔劑選擇用面對面的傾聽取代網路筆戰。',
          '協會理事長指出，與其指責他人「被騙」，不如理解訊息背後的焦慮與需求，才能真正讓人願意改變分享習慣。',
        ],
      },
      {
        id: 3, date: '2026-09-26', source: '中央社',
        title: '資訊素養推進協會發表年度報告　全台講座突破 950 場',
        content: [
          '社團法人台灣資訊素養推進協會今日發表年度成果，累計實體活動已超過 950 場，足跡遍及全台各縣市。',
          '協會表示，未來將持續培力在地講師，並與社區大學、圖書館合作，擴大媒體識讀教育的觸及範圍。',
        ],
      },
      {
        id: 4, date: '2026-09-12', source: '報導者',
        title: '市集裡的媒體識讀課：從菜價謠言談起的資訊防身術',
        content: [
          '志工們在傳統市場擺攤，以「菜價暴漲」等常見謠言為題，邀請攤商與顧客一起玩查證小遊戲。',
          '不少民眾驚訝地發現，原來日常聽到的消息有許多來源不明，現場反應熱烈。',
        ],
      },
      {
        id: 5, date: '2026-08-30', source: '聯合新聞網',
        title: '從聽眾到講師：種子志工培訓計畫第五屆結訓',
        content: [
          '第五屆種子志工培訓計畫日前圓滿結訓，共有 25 位學員完成課程與試講考核。',
          '結訓學員將回到各自社區，以在地語言與案例推廣資訊識讀，讓防治假新聞的力量從身邊開始扎根。',
        ],
      },
    ]);
    const isArticleOpen = ref(false);
    const activeArticle = ref(null);

    // ── UI 狀態 ──────────────────────────────────────────────────────
    const isSticky   = ref(false);
    const isFabVisible = ref(false);
    const isFabOpen  = ref(false);
    const isNavOpen  = ref(false);
    const whoAreWeType = ref('main'); // main: 我們是誰, timeline: 時間軸, vision: 願景, coreValue: 核心價值, mission: 使命

    // ── Banner 方法 ─────────────────────────────────────────────────────
    function nextBanner() {
      currentBannerIndex.value = (currentBannerIndex.value + 1) % bannerSlides.value.length;
    }
    function goToBanner(index) {
      currentBannerIndex.value = index;
    }

    // ── Accordion 方法 ──────────────────────────────────────────────────
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

    // ── 成果統計方法 ────────────────────────────────────────────────────
    function updateStats(data) {
      Object.assign(currentStats, data);
    }
    function resetStats() {
      Object.assign(currentStats, defaultStats);
    }

    // ── 文章列表方法 ────────────────────────────────────────────────────
    const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    function formatWeekday(dateStr) {
      const [y, m, d] = dateStr.split('-').map(Number);
      return WEEKDAYS[new Date(y, m - 1, d).getDay()];
    }
    function formatMonthDay(dateStr) {
      const [, m, d] = dateStr.split('-');
      return m + '/' + d;
    }
    function openArticle(item) {
      activeArticle.value = item;
      isArticleOpen.value = true;
    }

    // ── Scroll / Nav / FAB 方法 ─────────────────────────────────────────
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

    // ── Count-up 動畫（供 onMounted 使用）───────────────────────────────
    // 透過更新 currentStats reactive 物件讓 Vue 渲染數字，避免直接操作 DOM 被 Vue 蓋掉
    function countUp(target, suffix, duration, key) {
      const start = performance.now();
      function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4); // ease-out-quart
        const val = Math.round(eased * target);
        currentStats[key] = suffix ? val + suffix : val;
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          // 動畫結束，確保最終值與 defaultStats 一致
          currentStats[key] = defaultStats[key];
        }
      }
      requestAnimationFrame(step);
    }

    // ── onMounted ───────────────────────────────────────────────────────
    onMounted(async () => {
      // nice-select（jQuery，保留）
      if (typeof $ !== 'undefined') $('select').niceSelect();

      // Scroll 監聽
      window.addEventListener('scroll', onScroll);
      window.addEventListener('resize', onScroll);
      onScroll();

      // Banner 自動輪播（每 5 秒）
      setInterval(nextBanner, 5000);

      // 鍵盤控制 Accordion
      document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft')  prevAccordionSlide();
        if (e.key === 'ArrowRight') nextAccordionSlide();
      });

      // ── 台灣地圖（D3）────────────────────────────────────────────────
      const topo = await d3.json('https://taiwan.md/assets/geo/taiwan-country.topo.json');
      const counties = topojson.feature(topo, topo.objects.map);

      const mainProjection = d3.geoMercator()
        .center([121, 24])
        .scale(11000)
        .translate([500, 400]);
      const mainPath = d3.geoPath().projection(mainProjection);

      const penghuPath = d3.geoPath().projection(
        d3.geoMercator().center([119.6, 23.5]).scale(20000).translate([220, 550])
      );
      const kinmenPath = d3.geoPath().projection(
        d3.geoMercator().center([118.4, 24.4]).scale(15000).translate([210, 371])
      );
      const matsuPath = d3.geoPath().projection(
        d3.geoMercator().center([119.9, 26.2]).scale(15000).translate([210, 208])
      );

      const insetPaths = {
        '10016': penghuPath,
        '09020': kinmenPath,
        '09007': matsuPath,
      };
      const INSET_IDS = new Set(Object.keys(insetPaths));

      const svg = d3.select('#taiwan-map');

      // 外島虛線框 + 標籤
      const insetBoxes = [
        { x: 200, y: 120, w: 180, h: 180, label: '馬祖' },
        { x: 150, y: 320, w: 100, h: 70,  label: '金門' },
        { x: 120, y: 440, w: 180, h: 240, label: '澎湖' },
      ];
      insetBoxes.forEach(b => {
        svg.append('rect')
          .attr('x', b.x).attr('y', b.y)
          .attr('width', b.w).attr('height', b.h)
          .attr('fill', 'none')
          .attr('stroke', '#bbb')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '4,3');
        svg.append('text')
          .attr('x', b.x + b.w / 2).attr('y', b.y + b.h + 28)
          .attr('text-anchor', 'middle')
          .attr('font-size', '20px')
          .attr('fill', '#888')
          .text(b.label);
      });

      // 繪製縣市
      svg.selectAll('path')
        .data(counties.features)
        .join('path')
          .attr('d', d => {
            const id = d.properties.id;
            return INSET_IDS.has(id) ? insetPaths[id](d) : mainPath(d);
          })
          .attr('fill', '#e8e8e8')
          .attr('stroke', '#999')
          .attr('stroke-width', 0.8)
          .on('mouseenter', function (event, d) {
            d3.select(this).attr('fill', '#f5204b');
            const stats = countyStats[d.properties.id];
            if (stats) updateStats(stats);
          })
          .on('mouseleave', function () {
            d3.select(this).attr('fill', '#e8e8e8');
            resetStats();
          });

      // ── Scroll Reveal ────────────────────────────────────────────────
      const revealTargets = [
        '.exprience-thumb',
        '.exprience-content',
        '#what-we-do .col-md-4',
        '#recent-activity .col-md-4',
        '#achievement .col-lg-3',
        '#news .col-md-4',
        '.contact-area .col-lg-4',
        '.video-area .col-lg-6',
        '.section-gap-3 .col-lg-6',
      ];
      revealTargets.forEach(selector => {
        document.querySelectorAll(selector).forEach((el, i) => {
          el.classList.add('reveal');
          el.dataset.delay = String(i % 4 + 1);
        });
      });

      const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });

      document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

      // ── Stats Count-up ───────────────────────────────────────────────
      const statsSection = document.querySelector('#achievement');
      if (statsSection) {
        let statsTriggered = false;
        const statKeys = ['events', 'trainers', 'volunteers', 'families'];
        const statsObserver = new IntersectionObserver(entries => {
          if (entries[0].isIntersecting && !statsTriggered) {
            statsTriggered = true;
            statKeys.forEach((key, i) => {
              const raw = String(defaultStats[key]);
              const match = raw.match(/^(\d+)(.*)/);
              if (match) {
                const num = parseInt(match[1], 10);
                const suffix = match[2];
                // 先設為 0，再啟動動畫
                currentStats[key] = 0 + suffix;
                setTimeout(() => countUp(num, suffix, 1400, key), i * 180);
              } else {
                // 非純數字（如 '5萬'）：直接顯示，不做 count-up
                currentStats[key] = defaultStats[key];
              }
            });
            statsObserver.disconnect();
          }
        }, { threshold: 0.3 });
        statsObserver.observe(statsSection);
      }
    });

    return {
      // 資料
      bannerSlides, currentBannerIndex,
      accordionSlides, activeSlideIndex,
      currentStats,
      newsCards, isMoreCardsOpen, isActivityOpen, activeActivity, openActivity,
      articles, isArticleOpen, activeArticle,
      // UI 狀態
      isSticky, isFabVisible, isFabOpen, isNavOpen, whoAreWeType,
      // 方法
      nextBanner, goToBanner,
      setActiveSlide,
      formatWeekday, formatMonthDay, openArticle,
      toggleFab, closeFabAndScroll, toggleNav, smoothScroll,
    };
  }
}).use(vuetify).mount('#app');
