// ============================================
// محسّن Web Vitals المتقدم
// LCP (Largest Contentful Paint) - CLS (Cumulative Layout Shift) - INP (Interaction to Next Paint)
// ============================================

// ============================================
// 1. تحسين LCP - Largest Contentful Paint
// ============================================

/**
 * تحميل الصور المهمة مسبقاً (Preload Critical Images)
 * LCP يقيس سرعة ظهور أكبر عنصر مرئي (عادة صورة أو نص كبير)
 */
function preloadCriticalImages() {
  const criticalImages = [
    'img/mosab.png',        // صورتك الشخصية
    'img/star-shape.png',      // أيقونة النجمة
    'img/star outline.png',  //صورة النجمة الذهبية
    'img/baby.png',             // صورة البيبي
    'img/university.png'       // صورة الجامعة
  ];

  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    link.fetchPriority = 'high'; // أولوية عالية
    document.head.appendChild(link);
  });
}

/**
 * تحميل الخطوط مسبقاً (Preload Fonts)
 * Font Awesome تأخذ وقت في التحميل
 */
function preloadFonts() {
  const fontAwesomeLink = document.querySelector('link[href*="font-awesome"]');
  if (fontAwesomeLink) {
    fontAwesomeLink.rel = 'preload';
    fontAwesomeLink.as = 'style';
  }
}

/**
 * تحميل الصور بشكل lazy للصور غير المهمة
 * يحسّن LCP بتقليل الحمل الأولي
 */
function implementLazyLoading() {
  // الصور التي ليست في Viewport الأولي
  const lazyImages = document.querySelectorAll('.LifeEvent, .LifeEvent1');
  
  // تحقق من دعم المتصفح
  if ('loading' in HTMLImageElement.prototype) {
    lazyImages.forEach(img => {
      img.loading = 'lazy';
    });
  } else {
    // Fallback للمتصفحات القديمة
    const lazyLoadScript = document.createElement('script');
    lazyLoadScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    document.body.appendChild(lazyLoadScript);
  }
}

/**
 * تحسين حجم الصور (Image Optimization Hints)
 * يضيف width و height لمنع CLS
 */
function optimizeImageSizes() {
  const images = document.querySelectorAll('img:not([width]):not([height])');
  
  images.forEach(img => {
    // حساب الأبعاد من CSS إذا كانت موجودة
    const computedStyle = window.getComputedStyle(img);
    const width = parseInt(computedStyle.width);
    const height = parseInt(computedStyle.height);
    
    if (width && height) {
      img.setAttribute('width', width);
      img.setAttribute('height', height);
    }
  });
}

// ============================================
// 2. تحسين CLS - Cumulative Layout Shift
// ============================================

/**
 * تثبيت أبعاد العناصر قبل التحميل
 * يمنع القفزات في التخطيط
 */
function reserveSpaceForDynamicContent() {
  // حجز مساحة للصورة الشخصية
  const personalImageContainer = document.querySelector('.waet');
  if (personalImageContainer && !personalImageContainer.style.minHeight) {
    personalImageContainer.style.minHeight = '200px';
    personalImageContainer.style.minWidth = '200px';
  }

  // حجز مساحة للدوائر
  const circles = document.querySelectorAll('.circle');
  circles.forEach(circle => {
    if (!circle.style.minHeight) {
      circle.style.minHeight = '80px';
      circle.style.minWidth = '80px';
    }
  });

  // حجز مساحة للمحتوى
  const contents = document.querySelectorAll('.Content');
  contents.forEach(content => {
    if (!content.style.minHeight) {
      content.style.minHeight = '270px';
    }
  });
}

/**
 * منع التحميل المفاجئ للخطوط
 * استخدام font-display: swap
 */
function optimizeFontLoading() {
  // إضافة CSS لتحسين تحميل الخطوط
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'FontAwesome';
      font-display: swap; /* يعرض نص احتياطي حتى يتم تحميل الخط */
    }
  `;
  document.head.appendChild(style);
}

/**
 * تأخير الرسوم المتحركة غير المهمة
 * تمنع القفزات أثناء التحميل
 */
function deferNonCriticalAnimations() {
  // تأخير أنميشن النجوم حتى يكتمل التحميل
  const starImages = document.querySelectorAll('.starimg');
  starImages.forEach(img => {
    img.style.transition = 'none'; // إيقاف الـ transition مؤقتاً
  });

  // إعادة تفعيلها بعد التحميل
  window.addEventListener('load', () => {
    setTimeout(() => {
      starImages.forEach(img => {
        img.style.transition = ''; // استعادة الـ transition
      });
    }, 100);
  });
}

/**
 * تثبيت أبعاد SVG
 * SVG قد تسبب layout shifts
 */
function stabilizeSVGElements() {
  const svgContainers = document.querySelectorAll('.svg-container');
  svgContainers.forEach(container => {
    const svg = container.querySelector('svg');
    if (svg) {
      const viewBox = svg.getAttribute('viewBox');
      if (viewBox) {
        const [, , width, height] = viewBox.split(' ');
        svg.style.aspectRatio = `${width} / ${height}`;
      }
    }
  });
}

// ============================================
// 3. تحسين INP - Interaction to Next Paint
// ============================================

/**
 * استخدام requestIdleCallback للمهام غير العاجلة
 * يحسّن استجابة التفاعل
 */
function scheduleNonUrgentTasks(callback) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout: 2000 });
  } else {
    // Fallback للمتصفحات القديمة
    setTimeout(callback, 1);
  }
}

/**
 * تقسيم المهام الثقيلة (Task Splitting)
 * يمنع blocking للـ main thread
 */
async function processHeavyTaskInChunks(items, processor, chunkSize = 5) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    
    // معالجة كل chunk
    chunk.forEach(processor);
    
    // إعطاء فرصة للمتصفح للتنفس
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

/**
 * تحسين Event Listeners
 * استخدام passive listeners لتحسين scroll performance
 */
function optimizeEventListeners() {
  // العثور على جميع scroll listeners
  const scrollElements = document.querySelectorAll('[data-scroll-listener]');
  
  // إضافة passive: true لتحسين الأداء
  window.addEventListener('scroll', function scrollHandler() {
    // معالجة الـ scroll
  }, { passive: true, capture: false });

  // استخدام debounce للأحداث المتكررة
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      // الكود الذي يحتاج للتنفيذ بعد انتهاء الـ scroll
    }, 150);
  }, { passive: true });
}

/**
 * Debounce function لتقليل التنفيذ المتكرر
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function لتحديد معدل التنفيذ
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * تحسين أداء الأنميشن باستخدام will-change
 * يخبر المتصفح بالعناصر التي ستتحرك
 */
function optimizeAnimationPerformance() {
  // العناصر التي لها أنميشن
  const animatedElements = document.querySelectorAll(
    '.waet, .circle, .Content, .line, .icon, .contact-inputs'
  );

  animatedElements.forEach(el => {
    // إضافة will-change فقط قبل الأنميشن
    el.addEventListener('mouseenter', () => {
      el.style.willChange = 'transform, opacity';
    }, { once: false });

    // إزالة will-change بعد الأنميشن
    el.addEventListener('mouseleave', () => {
      el.style.willChange = 'auto';
    }, { once: false });
  });
}

/**
 * تأخير تحميل JavaScript غير الضروري
 */
function deferNonCriticalJS() {
  // تأخير Font Awesome إذا لم تكن ضرورية فوراً
  const fontAwesomeLink = document.querySelector('link[href*="font-awesome"]');
  if (fontAwesomeLink) {
    fontAwesomeLink.media = 'print';
    fontAwesomeLink.onload = function() {
      this.media = 'all';
    };
  }
}

// ============================================
// 4. مراقبة Web Vitals (اختياري للتطوير)
// ============================================

/**
 * قياس وتسجيل Web Vitals
 * مفيد للتطوير والتتبع
 */
function measureWebVitals() {
  if (!('PerformanceObserver' in window)) return;

  // قياس LCP
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('🎨 LCP:', lastEntry.renderTime || lastEntry.loadTime, 'ms');
      console.log('LCP Element:', lastEntry.element);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    console.warn('LCP monitoring not supported');
  }

  // قياس CLS
  try {
    let clsScore = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
          console.log('📏 CLS Score:', clsScore.toFixed(4));
          if (entry.sources) {
            entry.sources.forEach(source => {
              console.log('CLS Source:', source.node);
            });
          }
        }
      }
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    console.warn('CLS monitoring not supported');
  }

  // قياس INP (First Input Delay كبديل)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        console.log('⚡ First Input Delay:', entry.processingStart - entry.startTime, 'ms');
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    console.warn('FID monitoring not supported');
  }
}

// ============================================
// 5. تحسين تحميل CSS
// ============================================

/**
 * تحميل CSS الحرج أولاً
 */
function optimizeCSSLoading() {
  const cssLink = document.querySelector('link[href*="stael.css"]');
  if (cssLink) {
    // إضافة preload للـ CSS
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'style';
    preloadLink.href = cssLink.href;
    document.head.insertBefore(preloadLink, cssLink);
  }
}

// ============================================
// 6. Content Visibility للعناصر خارج Viewport
// ============================================

/**
 * استخدام content-visibility لتحسين الأداء
 * يؤجل رسم العناصر خارج الشاشة
 */
function implementContentVisibility() {
  const offscreenContent = document.querySelectorAll('.Content:not(.Content-one)');
  
  offscreenContent.forEach(content => {
    content.style.contentVisibility = 'auto';
    content.style.containIntrinsicSize = '210px 270px'; // حجم تقريبي
  });

  // للـ Footer أيضاً
  const footer = document.querySelector('.Footer');
  if (footer) {
    footer.style.contentVisibility = 'auto';
    footer.style.containIntrinsicSize = '100vw 500px';
  }
}

// ============================================
// 7. Resource Hints المتقدمة
// ============================================

/**
 * إضافة DNS prefetch و preconnect
 */
function addResourceHints() {
  const hints = [
    { rel: 'dns-prefetch', href: '//cdnjs.cloudflare.com' },
    { rel: 'preconnect', href: 'https://cdnjs.cloudflare.com', crossorigin: true }
  ];

  hints.forEach(hint => {
    const link = document.createElement('link');
    link.rel = hint.rel;
    link.href = hint.href;
    if (hint.crossorigin) link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

// ============================================
// 8. التهيئة الرئيسية
// ============================================

/**
 * تشغيل جميع التحسينات
 */
function initializePerformanceOptimizations() {
  // التحسينات الفورية (قبل DOMContentLoaded)
  if (document.readyState === 'loading') {
    // قبل تحميل DOM
    addResourceHints();
    preloadCriticalImages();
    preloadFonts();
    optimizeCSSLoading();
  }

  // بعد تحميل DOM
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    runDOMOptimizations();
  } else {
    document.addEventListener('DOMContentLoaded', runDOMOptimizations);
  }

  // بعد تحميل الصفحة بالكامل
  window.addEventListener('load', runPostLoadOptimizations);
}

/**
 * التحسينات التي تحتاج DOM
 */
function runDOMOptimizations() {
  reserveSpaceForDynamicContent();
  optimizeImageSizes();
  stabilizeSVGElements();
  implementLazyLoading();
  optimizeFontLoading();
  deferNonCriticalAnimations();
  optimizeEventListeners();
  optimizeAnimationPerformance();
  implementContentVisibility();
}

/**
 * التحسينات بعد التحميل الكامل
 */
function runPostLoadOptimizations() {
  scheduleNonUrgentTasks(() => {
    deferNonCriticalJS();
    
    // تفعيل قياس Web Vitals في وضع التطوير فقط
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      measureWebVitals();
    }
  });
}

// ============================================
// 9. تشغيل التحسينات
// ============================================

// بدء التحسينات فوراً
initializePerformanceOptimizations();

// ============================================
// 10. إضافات مفيدة
// ============================================

/**
 * تنظيف الذاكرة عند مغادرة الصفحة
 */
window.addEventListener('beforeunload', () => {
  // إيقاف جميع الـ observers
  if (window.lcpObserver) window.lcpObserver.disconnect();
  if (window.clsObserver) window.clsObserver.disconnect();
  if (window.fidObserver) window.fidObserver.disconnect();
});

/**
 * إعادة حساب التحسينات عند تغيير حجم النافذة
 */
const handleResize = debounce(() => {
  optimizeImageSizes();
  stabilizeSVGElements();
}, 250);

window.addEventListener('resize', handleResize, { passive: true });

console.log('✅ Performance optimizations initialized successfully!');