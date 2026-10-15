/* うさぎの森 えいごスクール
   ※ 以降のステップでは末尾に追記していきます（既存コードは書き換えません） */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- ハンバーガーメニュー ---- */
  var toggle = document.querySelector('.nav-toggle');
  var drawer = document.getElementById('drawer');

  if (toggle && drawer) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      drawer.hidden = open;
    });
    drawer.addEventListener('click', function (e) {
      // リンクの中の画像や文字（コースカードの img・span など）を押したときも閉じる
      if (e.target.closest('a')) {
        toggle.setAttribute('aria-expanded', 'false');
        drawer.hidden = true;
      }
    });
  }

  /* ---- スクロールで要素を表示 ---- */
  var targets = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---- FAQアコーディオン ---- */
  document.querySelectorAll('.faq-item__q').forEach(function (q) {
    q.addEventListener('click', function () {
      var open = q.getAttribute('aria-expanded') === 'true';
      q.setAttribute('aria-expanded', String(!open));
      q.nextElementSibling.classList.toggle('is-open', !open);
    });
  });

  /* ---- コースカードの横スクロール ---- */
  var list = document.getElementById('courseList');
  var prev = document.querySelector('.course__arrow--prev');
  var next = document.querySelector('.course__arrow--next');

  if (list && prev && next) {
    var step = function () {
      var card = list.querySelector('.course-card');
      return card ? card.offsetWidth + 22 : 280;
    };
    prev.addEventListener('click', function () { list.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { list.scrollBy({ left:  step(), behavior: 'smooth' }); });

    /* 無限ループ：カード6枚の複製を前後に3組ずつ並べ［複製×3｜本物｜複製×3］にする。
       スクロールが止まったときに複製の上にいたら、同じ見た目の本物の位置へ一瞬で移す。
       → 最後のカードの次に1枚目が右から出てくる（前へ戻るときも同じ）。
       指でのスワイプは、指を離して慣性スクロールが止まってから移す（触っている最中に
       位置を変えるとスマホのブラウザに無視されるため）。複製を3組にしているのは、
       勢いよくはじいても複製の端まで届かないようにするため */
    var LOOP_SETS = 3;
    var originals = Array.prototype.slice.call(list.children);
    var makeClone = function (card) {
      var clone = card.cloneNode(true);
      clone.classList.remove('reveal');        // 複製は登場アニメーションなしで最初から表示
      clone.setAttribute('aria-hidden', 'true'); // 読み上げ・Tab移動は本物だけ
      clone.querySelectorAll('a').forEach(function (a) { a.tabIndex = -1; });
      return clone;
    };
    for (var s = 0; s < LOOP_SETS; s++) {
      originals.forEach(function (card) { list.appendChild(makeClone(card)); });
      originals.slice().reverse().forEach(function (card) { list.insertBefore(makeClone(card), list.firstChild); });
    }

    // 本物の1枚目の位置と、6枚ぶん（1組）の幅
    var loopBase = function () { return originals[0].offsetLeft - list.firstElementChild.offsetLeft; };
    var loopWidth = function () { return list.children[(LOOP_SETS + 1) * originals.length].offsetLeft - originals[0].offsetLeft; };
    // smooth を一時的に切って、見た目を変えずに位置だけ移す
    var jumpTo = function (x) {
      list.style.scrollBehavior = 'auto';
      list.scrollLeft = x;
      void list.offsetWidth;
      list.style.scrollBehavior = '';
    };
    // 本物の範囲［base, base + w）から外れていたら、何組ぶんでもずらして本物へ戻す
    var touching = false;
    var normalize = function () {
      if (touching) return;
      var base = loopBase(), w = loopWidth();
      var offset = list.scrollLeft - base;
      if (offset >= -1 && offset < w - 1) return;
      jumpTo(base + (((offset % w) + w) % w));
    };

    var loopTimer;
    var scheduleNormalize = function () {
      clearTimeout(loopTimer);
      loopTimer = setTimeout(normalize, 150); // スクロール（スナップ・慣性）が止まってから
    };
    list.addEventListener('scroll', scheduleNormalize, { passive: true });
    list.addEventListener('scrollend', normalize); // 対応ブラウザでは止まった瞬間に
    list.addEventListener('touchstart', function () { touching = true; clearTimeout(loopTimer); }, { passive: true });
    var onTouchEnd = function () { touching = false; scheduleNormalize(); };
    list.addEventListener('touchend', onTouchEnd, { passive: true });
    list.addEventListener('touchcancel', onTouchEnd, { passive: true });
    window.addEventListener('resize', normalize);
    jumpTo(loopBase()); // 最初は本物の1枚目から
  }

  /* ---- コース画像がまだ無い間は壊れた画像の枠を隠す（うすい丸だけ見せる） ---- */
  document.querySelectorAll('.course-card__img img').forEach(function (img) {
    var hide = function () { img.style.visibility = 'hidden'; };
    if (img.complete && img.naturalWidth === 0) hide();
    else img.addEventListener('error', hide);
  });

  /* ---- 追従CTA（ヒーローを過ぎたら表示） ---- */
  var cta = document.querySelector('.floating-cta');
  var hero = document.querySelector('.hero');

  if (cta && hero && 'IntersectionObserver' in window) {
    var ctaObserver = new IntersectionObserver(function (entries) {
      cta.classList.toggle('is-visible', !entries[0].isIntersecting);
    }, { threshold: 0 });
    ctaObserver.observe(hero);
  } else if (cta && !hero) {
    cta.classList.add('is-visible'); // ヒーローのない下層ページ（お知らせ詳細など）は最初から表示
  }

  /* ---- 追従CTAがコピーライトに重ならないよう、帯が見えている高さ分だけ持ち上げる ---- */
  var copyright = document.querySelector('.copyright');
  if (cta && copyright) {
    var liftTicking = false;
    var liftCta = function () {
      liftTicking = false;
      // 画面の下端からコピーライトの帯が見えている高さ（見えていなければ 0）
      var lift = Math.max(0, window.innerHeight - copyright.getBoundingClientRect().top);
      cta.style.setProperty('--copy-lift', lift + 'px');
      cta.classList.toggle('is-lifted', lift > 0);
    };
    window.addEventListener('scroll', function () {
      if (!liftTicking) { liftTicking = true; requestAnimationFrame(liftCta); }
    }, { passive: true });
    window.addEventListener('resize', liftCta);
    liftCta();
  }

  /* ---- ドロワー表示中の背景マスク ---- */
  var mask = document.getElementById('drawerMask');

  if (toggle && drawer && mask) {
    // 上のハンバーガー処理のあとに実行され、ドロワーの開閉にマスクを合わせる
    var syncMask = function () { mask.hidden = drawer.hidden; };
    toggle.addEventListener('click', syncMask);
    drawer.addEventListener('click', syncMask);
    // マスクをクリックしたらドロワーを閉じる
    mask.addEventListener('click', function () { toggle.click(); });
  }

  /* ---- ヒーローのリード文を一行ずつ表示 ---- */
  var lineGroups = document.querySelectorAll('.js-lines');

  // 動きを減らす設定・非対応ブラウザでは最初から全部表示のまま
  if (lineGroups.length && !reduceMotion && 'IntersectionObserver' in window) {
    var onLines = function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    };
    var lineObserver = new IntersectionObserver(onLines, { threshold: 0.3, rootMargin: '0px 0px -15% 0px' });
    // .js-lines--early（Concept）は、画面に少し入った時点ですぐ動き出す
    var earlyLineObserver = new IntersectionObserver(onLines, { threshold: 0.05, rootMargin: '0px' });
    lineGroups.forEach(function (el) {
      el.classList.add('is-ready');
      (el.classList.contains('js-lines--early') ? earlyLineObserver : lineObserver).observe(el);
    });
  }

  /* ---- ワールド：景色を止めて、吹き出し・サボテンだけ流す（その後Aboutがかぶさる）----
     見た目の固定（sticky）とAboutのせり上がりはCSS（.js-parallax）。ここでは
     ・景色が画面より高いときの止める位置（--scene-top）
     ・止まっている間に流す吹き出し・サボテンの移動量
     を計算する */
  var world = document.querySelector('.world');
  var scene = world && world.querySelector(':scope > .wrap');

  if (world && scene && !reduceMotion) {
    document.documentElement.classList.add('js-parallax');

    // [要素, 速さ]：景色が止まってからスクロールした量 × 速さ だけ上へ流れる
    var parallaxItems = [
      [document.querySelector('.bubble--3'), 0.9],
      [document.querySelector('.world__cactus'), 0.6],
      [document.querySelector('.world__photo--2'), 0.6], // サボテンと一緒に流す左の写真
      [document.querySelector('.world__photo--1'), 0.6]  // 右の写真も同じ速さで流す
    ].filter(function (item) { return item[0]; });
    var sceneTop = 0;
    var ticking = false;

    // 景色が画面より高いときは、下端が画面の下にそろった位置で止める
    var measure = function () {
      sceneTop = Math.min(0, window.innerHeight - scene.offsetHeight);
      world.style.setProperty('--scene-top', sceneTop + 'px');
    };

    var update = function () {
      ticking = false;
      // 景色が止まった瞬間から 0 → 増えていく
      var p = Math.max(0, sceneTop - world.getBoundingClientRect().top);
      parallaxItems.forEach(function (item) {
        item[0].style.translate = '0 ' + (-p * item[1]).toFixed(1) + 'px';
      });
    };

    var onScroll = function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { measure(); onScroll(); });
    window.addEventListener('load', function () { measure(); onScroll(); }); // 画像読み込み後に高さが変わるため
    measure();
    update();
  }

  /* ---- お知らせのページ（news.html）：カテゴリの絞り込み＋つづきを見る ---- */
  var newsList = document.getElementById('newsList');

  if (newsList) {
    var PAGE_SIZE = 12;  // 最初に表示する件数・1回に追加する件数（追加は4件ずつ）
    var MORE_SIZE = 4;
    var newsItems = Array.prototype.slice.call(newsList.querySelectorAll('.news-item'));
    var filterBtns = document.querySelectorAll('.news-filter__btn');
    var moreWrap = document.querySelector('.news-more');
    var moreBtn = document.querySelector('.news-more__btn');
    var emptyMsg = document.querySelector('.news-empty');
    var currentFilter = 'all';
    var shownCount = PAGE_SIZE;

    var renderNews = function (animate) {
      var matched = newsItems.filter(function (item) {
        return currentFilter === 'all' || item.dataset.cat.split(' ').indexOf(currentFilter) !== -1;
      });
      newsItems.forEach(function (item) {
        var idx = matched.indexOf(item);
        var show = idx !== -1 && idx < shownCount;
        var wasHidden = item.hidden;
        item.hidden = !show;
        // 新しく出てきたカードだけ、ふわっと表示
        if (show && (wasHidden || animate)) {
          item.classList.remove('is-appear');
          void item.offsetWidth; // アニメーションをやり直すため
          item.classList.add('is-appear');
        }
      });
      if (moreWrap) moreWrap.hidden = matched.length <= shownCount;
      if (emptyMsg) emptyMsg.hidden = matched.length !== 0;
    };

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentFilter = btn.dataset.filter;
        shownCount = PAGE_SIZE;
        filterBtns.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-pressed', String(on));
        });
        renderNews(true);
      });
    });

    if (moreBtn) {
      moreBtn.addEventListener('click', function () {
        shownCount += MORE_SIZE;
        renderNews(false);
      });
    }

    renderNews(false);
    newsItems.forEach(function (item) { item.classList.remove('is-appear'); }); // 最初の表示はアニメーションなし
  }

  /* ---- ロード画面（index.html）：画像・3Dモデル（先生・うさぎ）・フォントが
     すべて読み込まれたら html の is-loading を外してトップページを表示 ---- */
  var loader = document.getElementById('siteLoader');

  if (loader) {
    var waits = [];

    // ページ内の画像など（window の load）
    waits.push(new Promise(function (resolve) {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve, { once: true });
    }));

    // 3Dモデル：読み込み完了（失敗したときも先へ進む）
    document.querySelectorAll('model-viewer').forEach(function (mv) {
      waits.push(new Promise(function (resolve) {
        if (mv.loaded) { resolve(); return; }
        mv.addEventListener('load', resolve, { once: true });
        mv.addEventListener('error', resolve, { once: true });
      }));
    });

    // Webフォント
    if (document.fonts && document.fonts.ready) waits.push(document.fonts.ready);

    var done = false;
    var finishLoading = function () {
      if (done) return;
      done = true;
      // 1フレーム待ってから外し、ロード画面が消えるのと同時にヒーローの動きを始める
      requestAnimationFrame(function () {
        // 再読み込みでも必ずトップページの一番上から見せる（smooth にせず一瞬で移動）
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.classList.remove('is-loading');
      });
    };

    Promise.all(waits).then(finishLoading, finishLoading);
    // 通信が遅いときなどに閉じ込めないよう、最長15秒で表示する
    setTimeout(finishLoading, 15000);
  }
})();
