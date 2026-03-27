/**
 * 个人应聘网站 - 主脚本文件
 * 包含：导航栏效果、移动端菜单、滚动动画、返回顶部、图片懒加载
 */

(function() {
  'use strict';

  // ==================== DOM 元素缓存 ====================
  const navbar = document.querySelector('.navbar');
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const mobileOverlay = document.querySelector('.mobile-menu-overlay');
  const backToTop = document.querySelector('.back-to-top');

  // ==================== 页面加载动画 ====================
  document.body.classList.add('loading');
  
  window.addEventListener('load', function() {
    document.body.classList.remove('loading');
    document.body.classList.add('loaded');
    
    // 初始化滚动显示动画
    initRevealAnimations();
  });

  // ==================== 导航栏滚动效果 ====================
  let lastScrollY = 0;
  
  window.addEventListener('scroll', function() {
    const currentScrollY = window.scrollY;
    
    // 添加滚动样式
    if (currentScrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    
    // 显示/隐藏返回顶部按钮
    if (backToTop) {
      if (currentScrollY > 300) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }
    
    lastScrollY = currentScrollY;
  }, { passive: true });

  // ==================== 移动端菜单 ====================
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function() {
      this.classList.toggle('active');
      navLinks.classList.toggle('active');
      if (mobileOverlay) {
        mobileOverlay.classList.toggle('active');
      }
      document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    // 点击遮罩关闭菜单
    if (mobileOverlay) {
      mobileOverlay.addEventListener('click', function() {
        menuToggle.classList.remove('active');
        navLinks.classList.remove('active');
        this.classList.remove('active');
        document.body.style.overflow = '';
      });
    }

    // 点击导航链接后关闭菜单
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function() {
        if (navLinks.classList.contains('active')) {
          menuToggle.classList.remove('active');
          navLinks.classList.remove('active');
          if (mobileOverlay) {
            mobileOverlay.classList.remove('active');
          }
          document.body.style.overflow = '';
        }
      });
    });
  }

  // ==================== 返回顶部 ====================
  if (backToTop) {
    backToTop.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // ==================== 滚动显示动画 ====================
  function initRevealAnimations() {
    const revealElements = document.querySelectorAll('.section, .skill-card, .experience-item, .portfolio-card, .contact-wrap');
    
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal', 'active');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => {
      el.classList.add('reveal');
      revealObserver.observe(el);
    });
  }

  // ==================== 平滑滚动（锚点链接） ====================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const navHeight = navbar ? navbar.offsetHeight : 0;
        const targetPosition = targetElement.offsetTop - navHeight - 20;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ==================== 图片懒加载 ====================
  if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px'
    });

    lazyImages.forEach(img => {
      imageObserver.observe(img);
    });
  } else {
    // 回退方案：直接加载所有图片
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
    });
  }

  // ==================== 导航高亮当前页面 ====================
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ==================== 技能卡片动画延迟 ====================
  document.querySelectorAll('.skill-card').forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.05}s`;
  });

  // ==================== 作品卡片动画延迟 ====================
  document.querySelectorAll('.portfolio-card').forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.1}s`;
  });

  // ==================== 联系方式复制功能 ====================
  document.querySelectorAll('.contact-wrap span').forEach(span => {
    span.style.cursor = 'pointer';
    span.title = '点击复制';
    
    span.addEventListener('click', function() {
      const text = this.textContent;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          showCopyToast('已复制: ' + text);
        }).catch(() => {
          fallbackCopy(text);
        });
      } else {
        fallbackCopy(text);
      }
    });
  });

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showCopyToast('已复制: ' + text);
  }

  function showCopyToast(message) {
    const existingToast = document.querySelector('.copy-toast');
    if (existingToast) {
      existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: #1f2937;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      animation: toastIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  // 添加 toast 动画样式
  const toastStyle = document.createElement('style');
  toastStyle.textContent = `
    @keyframes toastIn {
      from { opacity: 0; transform: translate(-50%, 20px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
    @keyframes toastOut {
      from { opacity: 1; transform: translate(-50%, 0); }
      to { opacity: 0; transform: translate(-50%, -20px); }
    }
  `;
  document.head.appendChild(toastStyle);

})();
