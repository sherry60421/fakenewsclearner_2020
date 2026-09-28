
$(document).ready(function(){
	"use strict";

	var window_width 	 = $(window).width(),
	window_height 		 = window.innerHeight,
	header_height 		 = $(".default-header").height(),
	header_height_static = $(".site-header.static").outerHeight(),
	fitscreen 			 = window_height - header_height;


	$(".fullscreen").css("height", window_height)
	$(".fitscreen").css("height", fitscreen);

	// === Sticky Header：捲到 exprience-area 時讓 header 常駐頂部 ===
	var $header = $(".default-header");
	var $anchor = $(".exprience-area");

	function updateStickyHeader() {
		if ($anchor.length === 0) return;
		var triggerY = $anchor.offset().top;
		if ($(window).scrollTop() >= triggerY) {
			$header.addClass("sticky");
		} else {
			$header.removeClass("sticky");
		}
	}

	$(window).on("scroll", updateStickyHeader);
	updateStickyHeader(); // 頁面載入時也檢查一次

	// === 手機版浮動圓形選單：捲到 exprience-area 後顯示 ===
	var $fabWrap = $("#mobile-fab-wrap");
	var $fabBtn  = $("#mobile-fab");
	var $fabMenu = $("#mobile-fab-menu");
	var $fabIcon = $fabBtn.find("i");

	function updateFab() {
		// 只在手機版（≤767px）才操作
		if ($(window).width() > 767) return;
		if ($anchor.length === 0) return;
		var triggerY = $anchor.offset().top;
		if ($(window).scrollTop() >= triggerY) {
			$fabWrap.addClass("is-visible");
		} else {
			// 收起選單後隱藏
			$fabWrap.removeClass("is-visible fab-open");
			$fabBtn.attr("aria-expanded", "false");
			$fabIcon.attr("class", "lnr lnr-menu");
		}
	}

	// 點擊 FAB 按鈕：切換展開/收合
	$fabBtn.on("click", function () {
		var isOpen = $fabWrap.hasClass("fab-open");
		if (isOpen) {
			$fabWrap.removeClass("fab-open");
			$fabBtn.attr("aria-expanded", "false");
			$fabIcon.attr("class", "lnr lnr-cross");
			// 短暫延後再換回 menu icon（等收合動畫完成）
			setTimeout(function () {
				if (!$fabWrap.hasClass("fab-open")) {
					$fabIcon.attr("class", "lnr lnr-menu");
				}
			}, 320);
		} else {
			$fabWrap.addClass("fab-open");
			$fabBtn.attr("aria-expanded", "true");
			$fabIcon.attr("class", "lnr lnr-cross");
		}
	});

	// 點選選單連結的處理已移至下方統一處理（含平滑捲動）

	$(window).on("scroll", updateFab);
	$(window).on("resize", updateFab);
	updateFab(); // 頁面載入時也檢查一次

     
     // -------   Active Mobile Menu-----//
    // 只針對 header 內的漢堡選單，不影響 FAB 的 nav
    $(".menu-bar").on('click', function(e){
        e.preventDefault();
        $(".default-header nav").toggleClass('open');
        $("span", this).toggleClass("lnr-menu lnr-cross");
        $(".main-menu").addClass('mobile-menu');
    });
     
    $('select').niceSelect();

    // 平滑捲動：排除 FAB 選單內的連結（由 FAB 自己處理關閉後再捲動）
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        if (anchor.closest('#mobile-fab-menu')) return; // 跳過 FAB 選單
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // FAB 選單連結：先關閉選單，再平滑捲動
    $(document).on('click', '#mobile-fab-menu a', function (e) {
        e.preventDefault();
        var href = $(this).attr('href');
        $fabWrap.removeClass('fab-open');
        $fabBtn.attr('aria-expanded', 'false');
        setTimeout(function () {
            $fabIcon.attr('class', 'lnr lnr-menu');
            var target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        }, 280);
    });

 });

// === Scroll reveal ===
(function () {
  // Tag elements for reveal
  var revealTargets = [
    '.exprience-thumb',
    '.exprience-content',
    '.service-area-2 .col-md-4',
    '.service-area .col-lg-3',
    '.contact-area .col-lg-4',
    '.video-area .col-lg-6',
    '.section-gap-3 .col-lg-6',
  ];

  revealTargets.forEach(function (selector) {
    document.querySelectorAll(selector).forEach(function (el, i) {
      el.classList.add('reveal');
      el.dataset.delay = String(i % 4 + 1);
    });
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(function (el) {
    observer.observe(el);
  });

  // === Stats count-up ===
  function countUp(el, target, suffix, duration) {
    var start = performance.now();
    function step(now) {
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 4); // ease-out-quart
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var statsSection = document.querySelector('#archivement');
  if (statsSection) {
    var statsTriggered = false;
    var statsObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !statsTriggered) {
        statsTriggered = true;
        statsSection.querySelectorAll('.number').forEach(function (el, i) {
          var text = el.textContent.trim();
          var match = text.match(/^(\d+)(.*)/);
          if (match) {
            var num = parseInt(match[1], 10);
            var suffix = match[2];
            setTimeout(function () { countUp(el, num, suffix, 1400); }, i * 180);
          }
        });
        statsObserver.disconnect();
      }
    }, { threshold: 0.3 });
    statsObserver.observe(statsSection);
  }
})();
