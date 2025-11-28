// باقي التحريكات
  function addClass(selector, elementName) {
    const elements = document.querySelectorAll(selector);
    if (!elements.length) {
      console.warn(`${elementName} is not defined`);
      return;
    
    }
    elements.forEach(el => el.classList.add("move-load"));
  }
  
  addClass(".waet", "image");
  addClass(".Sidebar", "stars");
  addClass(".name", "name");

// ============================================
// متغيرات التحكم الرئيسية
// ============================================
const ANIMATION_CONFIG = {
  lineSpeed: 2.2,        //     2.3سرعة حركة الخط (كلما زادت القيمة كلما كان أسرع)
  lineSmooth: 0.05,      // نعومة الحركة (0.05 بطيء - 0.2 سريع)
  circleDelay: 0,      // التأخير قبل ظهور الدائرة (بالميلي ثانية)
  contentDelay: 200,     // التأخير قبل ظهور المحتوى بعد الدائرة (بالميلي ثانية)
  lineDelay: 0,         // التأخير قبل بدء الخط (يتداخل مع المحتوى)
  circleDuration: 400,   // مدة أنميشن الدائرة (بالميلي ثانية)
  contentDuration: 600   // مدة أنميشن ظهور المحتوى (بالميلي ثانية)
};

// ============================================
// إخفاء جميع العناصر في البداية
// ============================================
function hideAllElements() {
  document.querySelectorAll('.line').forEach(line => {
    line.style.opacity = '0';
    line.style.visibility = 'hidden';
  });
  
  document.querySelectorAll('.circle').forEach(circle => {
    circle.style.opacity = '0';
    circle.style.visibility = 'hidden';
  });
  
  document.querySelectorAll('.Content').forEach((content, index) => {
    if (index > 0) {
      content.style.opacity = '0';
      content.style.transform = 'translateY(-30px)';
      content.style.visibility = 'hidden';
    }
  });
}

// ============================================
// حساب التقدم المستهدف
// ============================================
function computeTargetProgress(svgContainer, speedMultiplier) {
  const rect = svgContainer.getBoundingClientRect();
  const vh = window.innerHeight;
  const elementTop = rect.top;
  const elementBottom = rect.bottom;
  const elementHeight = rect.height;

  if (elementBottom < 0) return 1;
  if (elementTop > vh) return 0;

  const visiblePart = Math.min(elementBottom, vh) - Math.max(elementTop, 0);
  const totalHeight = elementHeight + vh;
  let base = (vh - elementTop) / totalHeight;
  
  base = Math.max(0, Math.min(1, base));
  const progress = Math.max(0, Math.min(1, base * speedMultiplier));
  
  return progress;
}

// ============================================
// تهيئة الخطوط مع الحركة السلسة
// ============================================
let lineElements = [];

function initializeLines() {
  const paths = document.querySelectorAll('.pathline');
  lineElements = [];

  paths.forEach((path, index) => {
    const svgContainer = path.closest('.line');
    let pathLength = path.getTotalLength();

    path.style.strokeDasharray = pathLength + ' ' + pathLength;
    path.style.strokeDashoffset = -pathLength;

    let completed = false;
    let maxProgress = 0;
    let currentProgress = 0;
    let targetProgress = 0;
    let rafId = null;
    let visible = false;

    function updateOffsetByProgress(p) {
      const offset = -pathLength * (1 - p);
      path.style.strokeDashoffset = offset;
    }

    function loopStep() {
      // الاقتراب التدريجي من الهدف (Lerp للحركة الناعمة)
      const lerp = ANIMATION_CONFIG.lineSmooth;
      currentProgress += (targetProgress - currentProgress) * lerp;

      // لا نسمح بالرجوع للخلف
      if (currentProgress > maxProgress) {
        maxProgress = currentProgress;
      }

      updateOffsetByProgress(currentProgress);

      // التحقق من الاكتمال عند 98%
      if (!completed && currentProgress >= 0.95) {
        completed = true;
        currentProgress = 1;
        updateOffsetByProgress(1);
        
        // تفعيل العناصر التالية فوراً
        activateNextElements(index);
      }

      // الاستمرار في RAF
      if (!completed && Math.abs(targetProgress - currentProgress) > 0.001) {
        rafId = requestAnimationFrame(loopStep);
      } else if (!completed) {
        rafId = null;
      }
    }

    function onScroll() {
      if (!visible || completed) return;

      const p = computeTargetProgress(svgContainer, ANIMATION_CONFIG.lineSpeed);
      
      // لا نسمح بالرجوع للخلف
      targetProgress = Math.max(targetProgress, p);

      // بدء RAF إذا لم يكن يعمل
      if (!rafId) {
        rafId = requestAnimationFrame(loopStep);
      }
    }

    lineElements.push({
      path,
      svgContainer,
      index,
      activate: () => {
        visible = true;
        
        // إظهار الخط بشكل سلس
        svgContainer.style.transition = 'opacity 400ms ease';
        svgContainer.style.opacity = '1';
        svgContainer.style.visibility = 'visible';
        
        // حساب التقدم الحالي وبدء الحركة
        setTimeout(() => {
          const initialProgress = computeTargetProgress(svgContainer, ANIMATION_CONFIG.lineSpeed);
          targetProgress = Math.max(0.01, initialProgress);
          currentProgress = 0;
          
          if (!rafId) {
            rafId = requestAnimationFrame(loopStep);
          }
        }, 50);
      },
      onScroll,
      isComplete: () => completed
    });

    window.addEventListener('scroll', onScroll, { passive: true });

    window.addEventListener('resize', () => {
      const newLen = path.getTotalLength();
      pathLength = newLen;
      path.style.strokeDasharray = newLen + ' ' + newLen;
      
      if (completed) {
        path.style.strokeDashoffset = 0;
      } else {
        path.style.strokeDashoffset = -newLen * (1 - currentProgress);
      }
    });
  });

  return lineElements;
}

// ============================================
// أنميشن الدائرة (بدون Promise للتسريع)
// ============================================
function activateCircle(canvas, index) {
  if (!canvas) return;
  
  canvas.style.visibility = 'visible';
  canvas.style.opacity = '1';
  
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 36;
  
  let startTime = null;
  const duration = ANIMATION_CONFIG.circleDuration;
  const growDuration = 180;
  
  function drawRotatingLine(progress, lineLength) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, lineLength, -Math.PI / 2, -Math.PI / 2 + (progress * 2 * Math.PI), false);
    ctx.lineTo(centerX, centerY);
    ctx.fillStyle = '#3838fc';
    ctx.fill();
    
    const angle = -Math.PI / 2 + (progress * 2 * Math.PI);
    const endX = centerX + lineLength * Math.cos(angle);
    const endY = centerY + lineLength * Math.sin(angle);
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = '#3838fc';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    
    let lineLength = radius;
    let progress = 0;
    
    if (elapsed < growDuration) {
      const growProgress = elapsed / growDuration;
      const easeGrowProgress = 1 - Math.pow(1 - growProgress, 3);
      lineLength = radius * easeGrowProgress;
      progress = 0;
    } else {
      const rotateElapsed = elapsed - growDuration;
      const rotateProgress = Math.min(rotateElapsed / duration, 1);
      progress = rotateProgress < 0.5 
        ? 2 * rotateProgress * rotateProgress 
        : 1 - Math.pow(-2 * rotateProgress + 2, 2) / 2;
      lineLength = radius;
    }
    
    drawRotatingLine(progress, lineLength);
    
    if (elapsed < growDuration + duration) {
      requestAnimationFrame(animate);
    }
  }
  
  requestAnimationFrame(animate);
}

// ============================================
// أنميشن المحتوى
// ============================================
function activateContent(content, index) {
  if (!content) return;
  
  content.style.visibility = 'visible';
  
  setTimeout(() => {
    content.style.opacity = '1';
    content.style.transform = 'translateY(0)';
  }, 30);
}

// ============================================
// تفعيل العناصر التالية (مع تداخل الأنميشن)
// ============================================
function activateNextElements(currentIndex) {
  const nextIndex = currentIndex + 1;
  
  const circles = document.querySelectorAll('.circle');
  const contents = document.querySelectorAll('.Content');
  
  // التحقق من وجود عناصر تالية
  if (nextIndex >= circles.length && nextIndex >= contents.length && nextIndex >= lineElements.length) {
    console.log('All animations completed!');
    return;
  }
  
  const nextCircle = circles[nextIndex];
  const nextContent = contents[nextIndex];
  
  // تفعيل الدائرة إذا كانت موجودة
  if (nextCircle) {
    setTimeout(() => {
      activateCircle(nextCircle, nextIndex);
    }, ANIMATION_CONFIG.circleDelay);
  }
  
  // تفعيل المحتوى إذا كان موجود
  if (nextContent) {
    setTimeout(() => {
      activateContent(nextContent, nextIndex);
    function add(selector){
  const elements = document.querySelectorAll(selector);
    
    elements.forEach(el => el.classList.add("move-load"));
   }
   
  add(".Content-two")
  add(".Content-three")
  add(".Content-four")
  add(".Content-five")

    
    }, ANIMATION_CONFIG.circleDelay + ANIMATION_CONFIG.contentDelay);
   
  }
  
  // تفعيل الخط التالي إذا كان موجود
  if (nextIndex < lineElements.length && lineElements[nextIndex]) {
    setTimeout(() => {
      lineElements[nextIndex].activate();
    }, ANIMATION_CONFIG.circleDelay + ANIMATION_CONFIG.contentDelay + ANIMATION_CONFIG.lineDelay);
  }
}

// ============================================
// التهيئة الرئيسية
// ============================================
addEventListener("load", () => {
  hideAllElements();
  initializeLines();
  
  setTimeout(() => {
    const firstCircle = document.querySelector('.circle');
    const firstContent = document.querySelector('.Content');
    
    // الدائرة الأولى
    if (firstCircle) {
      activateCircle(firstCircle, 0);
    }
    
    // المحتوى الأول
    setTimeout(() => {
      if (firstContent) {
        firstContent.classList.add('move-load');
        activateContent(firstContent, 0);
      }
    }, ANIMATION_CONFIG.contentDelay);
    
    // الخط الأول
    setTimeout(() => {
      if (lineElements.length > 0) {
        lineElements[0].activate();
      }
    }, ANIMATION_CONFIG.contentDelay + ANIMATION_CONFIG.lineDelay);
    
  }, 500);
  
  
  
  // النجوم
  const src = "img/star outline.png";
  const Itt = 160;
  const img = [
    {id: "img1", newsrc: src, time: 100 + Itt},
    {id: "img2", newsrc: src, time: 350 + Itt},
    {id: "img3", newsrc: src, time: 900 + Itt},
    {id: "img4", newsrc: src, time: 1100 + Itt},
    {id: "img6", newsrc: src, time: 100 + Itt},
    {id: "img7", newsrc: src, time: 300 + Itt},
    {id: "img11", newsrc: src, time: 120 + Itt},
    {id: "img12", newsrc: src, time: 300 + Itt},
    {id: "img13", newsrc: src, time: 900 + Itt},
    {id: "img14", newsrc: src, time: 1100 + Itt},
    {id: "img16", newsrc: src, time: 100 + Itt},
    {id: "img17", newsrc: src, time: 300 + Itt},
    {id: "img18", newsrc: src, time: 900 + Itt}
  ];
  
  const TRANSITION_MS = 300;
  
  function swapImageWithFade(imgEl, newSrc, time) {
    if (!imgEl) return;
    setTimeout(() => {
      imgEl.classList.add("fade-out");
      setTimeout(() => {
        imgEl.src = newSrc;
        imgEl.classList.remove("fade-out");
      }, TRANSITION_MS);
    }, time);
  }
  
  img.forEach(change => {
    const el = document.getElementById(change.id);
    if (!el) {
      console.warn(`element not found:`, change.id);
      return;
    }
    swapImageWithFade(el, change.newsrc, change.time);
  });

});


function inscroll(clas, px ) {
window.addEventListener("scroll" , function () {
const Footer = document.querySelector(clas);

if (window.scrollY >= px){
  Footer.classList.add("one")
}else{
  Footer.classList.remove("one")
}

})}

inscroll('.Footer',1850)
inscroll(".contact-form",1890)
inscroll(".social-media",1890)



