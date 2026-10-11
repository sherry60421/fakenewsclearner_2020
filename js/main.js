import * as d3 from 'd3';
import * as topojson from 'topojson-client';

const { createApp, ref, reactive, onMounted, computed } = Vue;

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
      { title: '街頭活動',   subtitle: '帶領志工向路人說明假新聞的危害',       img: 'https://picsum.photos/id/10/1200/800' },
      { title: '市集擺攤',   subtitle: '參加市集，讓群眾更認識整個議題',       img: 'https://picsum.photos/id/11/1028/700' },
      { title: '志工培訓',   subtitle: '訓練志工，讓更多人能參與我們的行動',   img: 'https://picsum.photos/id/12/320/240'  },
      { title: '大眾宣講',   subtitle: '結合關懷據點、社區大學等單位進行宣講', img: 'https://picsum.photos/id/13/1028/650' },
      { title: '講師培力',   subtitle: '從一對一訓練，至親身上台累積經驗',     img: 'https://picsum.photos/id/14/1028/750' },
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
      { id: 1, img: 'https://picsum.photos/id/11/1028/700', title: 'Card title', text: "Some quick example text to build on the card title and make up the bulk of the card's content.", link: '#' },
      { id: 2, img: 'https://picsum.photos/id/20/1028/700', title: 'Card title', text: "Some quick example text to build on the card title and make up the bulk of the card's content.", link: '#' },
      { id: 3, img: 'https://picsum.photos/id/42/1028/700', title: 'Card title', text: "Some quick example text to build on the card title and make up the bulk of the card's content.", link: '#' },
    ]);

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
      newsCards,
      // UI 狀態
      isSticky, isFabVisible, isFabOpen, isNavOpen, whoAreWeType,
      // 方法
      nextBanner, goToBanner,
      setActiveSlide,
      toggleFab, closeFabAndScroll, toggleNav, smoothScroll,
    };
  }
}).mount('#app');
