/**
 * 图片画廊功能
 * 支持点击查看大图、轮播浏览、缩略图导航、手势缩放和平移
 */

(function() {
  'use strict';

  // 图片数据配置 - 可根据需要扩展每个文章的图片列表
  const galleryData = {
    article1: {
      title: '文章作品一',
      images: [
        { src: 'images/Article1.png', alt: '文章作品一' }
      ]
    },
    article2: {
      title: '文章作品二',
      images: [
        { src: 'images/Article2.png', alt: '文章作品二' }
      ]
    },
    analysis: {
      title: '账号数据分析',
      images: [
        { src: 'images/Account Analysis.png', alt: '账号数据分析' }
      ]
    }
  };

  // DOM 元素
  let modal = null;
  let backdrop = null;
  let closeBtn = null;
  let prevBtn = null;
  let nextBtn = null;
  let imageContainer = null;
  let galleryImage = null;
  let thumbnailsSection = null;
  let thumbnailsContainer = null;
  let currentIndexSpan = null;
  let totalCountSpan = null;
  let titleElement = null;
  let zoomControls = null;
  let zoomResetBtn = null;

  // 当前状态
  let currentGallery = null;
  let currentImageIndex = 0;

  // 手势状态
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  let isSwiping = false;

  // 缩放和平移状态
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let lastScale = 1;
  let lastTranslateX = 0;
  let lastTranslateY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialDistance = 0;
  let isPinching = false;
  let lastTapTime = 0;

  // 性能优化：节流
  let rafId = null;
  let isAnimating = false;

  // 初始化
  function init() {
    // 获取DOM元素
    modal = document.getElementById('galleryModal');
    if (!modal) return;

    backdrop = modal.querySelector('.gallery-backdrop');
    closeBtn = modal.querySelector('.gallery-close');
    prevBtn = modal.querySelector('.gallery-prev');
    nextBtn = modal.querySelector('.gallery-next');
    imageContainer = modal.querySelector('.gallery-image-container');
    galleryImage = modal.querySelector('.gallery-image');
    thumbnailsSection = modal.querySelector('.gallery-thumbnails');
    thumbnailsContainer = modal.querySelector('.thumbnails-container');
    currentIndexSpan = modal.querySelector('.current-index');
    totalCountSpan = modal.querySelector('.total-count');
    titleElement = modal.querySelector('.gallery-title');
    zoomControls = modal.querySelector('.zoom-controls');
    zoomResetBtn = modal.querySelector('.zoom-reset-btn');

    // 绑定事件
    bindEvents();
  }

  // 绑定事件
  function bindEvents() {
    // 文章卡片点击事件
    document.querySelectorAll('.article-card[data-gallery]').forEach(card => {
      card.addEventListener('click', function() {
        const galleryId = this.dataset.gallery;
        openGallery(galleryId);
      });

      // 键盘支持
      card.setAttribute('tabindex', '0');
      card.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          const galleryId = this.dataset.gallery;
          openGallery(galleryId);
        }
      });
    });

    // 关闭按钮
    if (closeBtn) {
      closeBtn.addEventListener('click', closeGallery);
    }

    // 背景点击关闭
    if (backdrop) {
      backdrop.addEventListener('click', closeGallery);
    }

    // 图片容器点击关闭（点击图片空白区域）
    if (imageContainer) {
      imageContainer.addEventListener('click', function(e) {
        if (e.target === imageContainer) {
          closeGallery();
        }
      });
    }

    // 导航按钮
    if (prevBtn) {
      prevBtn.addEventListener('click', showPreviousImage);
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', showNextImage);
    }

    // 键盘导航
    document.addEventListener('keydown', handleKeydown);

    // 图片加载错误处理
    if (galleryImage) {
      galleryImage.addEventListener('error', function() {
        this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle"%3E图片加载失败%3C/text%3E%3C/svg%3E';
      });
    }

    // 移动端手势支持
    if (modal) {
      modal.addEventListener('touchstart', handleTouchStart, { passive: false });
      modal.addEventListener('touchmove', handleTouchMove, { passive: false });
      modal.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    // 鼠标滚轮缩放（桌面端）
    if (galleryImage) {
      galleryImage.addEventListener('wheel', handleWheel, { passive: false });
    }

    // 鼠标拖拽（桌面端）
    if (galleryImage) {
      galleryImage.addEventListener('mousedown', handleMouseDown);
      galleryImage.addEventListener('mousemove', handleMouseMove);
      galleryImage.addEventListener('mouseup', handleMouseUp);
      galleryImage.addEventListener('mouseleave', handleMouseUp);
    }

    // 双击缩放
    if (galleryImage) {
      galleryImage.addEventListener('dblclick', handleDoubleClick);
    }

    // 缩放重置按钮
    if (zoomResetBtn) {
      zoomResetBtn.addEventListener('click', resetZoom);
    }
  }

  // 打开画廊
  function openGallery(galleryId) {
    const gallery = galleryData[galleryId];
    if (!gallery) return;

    currentGallery = gallery;
    currentImageIndex = 0;

    // 设置标题
    if (titleElement) {
      titleElement.textContent = gallery.title;
    }

    // 显示/隐藏缩略图栏
    if (thumbnailsSection) {
      if (gallery.images.length > 1) {
        thumbnailsSection.classList.add('show');
        generateThumbnails(gallery.images);
      } else {
        thumbnailsSection.classList.remove('show');
      }
    }

    // 显示第一张图片
    showImage(0);

    // 显示模态框
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // 更新图片数量
    if (totalCountSpan) {
      totalCountSpan.textContent = gallery.images.length;
    }
  }

  // 生成缩略图
  function generateThumbnails(images) {
    if (!thumbnailsContainer) return;

    thumbnailsContainer.innerHTML = '';

    images.forEach((img, index) => {
      const thumbnail = document.createElement('div');
      thumbnail.className = 'thumbnail-item';
      thumbnail.innerHTML = `<img src="${img.src}" alt="${img.alt}">`;
      thumbnail.addEventListener('click', () => showImage(index));
      thumbnailsContainer.appendChild(thumbnail);
    });
  }

  // 显示指定索引的图片
  function showImage(index) {
    if (!currentGallery || !galleryImage) return;

    // 处理索引边界
    if (index < 0) {
      index = currentGallery.images.length - 1;
    } else if (index >= currentGallery.images.length) {
      index = 0;
    }

    currentImageIndex = index;
    const image = currentGallery.images[index];

    // 重置图片缩放状态
    resetZoom();

    // 更新图片
    galleryImage.src = image.src;
    galleryImage.alt = image.alt;

    // 更新计数器
    if (currentIndexSpan) {
      currentIndexSpan.textContent = index + 1;
    }

    // 更新缩略图选中状态
    updateThumbnailSelection(index);

    // 更新导航按钮状态
    updateNavigationButtons();
  }

  // 重置缩放
  function resetZoom() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    lastScale = 1;
    lastTranslateX = 0;
    lastTranslateY = 0;
    isDragging = false;
    isPinching = false;
    
    updateTransform();
    updateZoomControls();
  }

  // 更新变换
  function updateTransform() {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    
    rafId = requestAnimationFrame(() => {
      if (galleryImage) {
        galleryImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        galleryImage.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
      }
      rafId = null;
    });
  }

  // 更新缩放控制按钮状态
  function updateZoomControls() {
    if (zoomControls) {
      if (scale > 1) {
        zoomControls.classList.add('visible');
      } else {
        zoomControls.classList.remove('visible');
      }
    }
  }

  // 更新缩略图选中状态
  function updateThumbnailSelection(index) {
    if (!thumbnailsContainer) return;

    const thumbnails = thumbnailsContainer.querySelectorAll('.thumbnail-item');
    thumbnails.forEach((thumb, i) => {
      if (i === index) {
        thumb.classList.add('active');
        // 滚动到可见区域
        thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        thumb.classList.remove('active');
      }
    });
  }

  // 更新导航按钮状态
  function updateNavigationButtons() {
    if (!currentGallery) return;

    // 如果只有一张图片，隐藏导航按钮
    const hasMultiple = currentGallery.images.length > 1;
    if (prevBtn) prevBtn.style.visibility = hasMultiple ? 'visible' : 'hidden';
    if (nextBtn) nextBtn.style.visibility = hasMultiple ? 'visible' : 'hidden';
  }

  // 显示上一张图片
  function showPreviousImage() {
    showImage(currentImageIndex - 1);
  }

  // 显示下一张图片
  function showNextImage() {
    showImage(currentImageIndex + 1);
  }

  // 关闭画廊
  function closeGallery() {
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';
    currentGallery = null;
    currentImageIndex = 0;
    resetZoom();
  }

  // 键盘事件处理
  function handleKeydown(e) {
    if (!modal || !modal.classList.contains('active')) return;

    switch (e.key) {
      case 'Escape':
        closeGallery();
        break;
      case 'ArrowLeft':
        showPreviousImage();
        break;
      case 'ArrowRight':
        showNextImage();
        break;
      case '0':
      case 'r':
        resetZoom();
        break;
    }
  }

  // 触摸开始
  function handleTouchStart(e) {
    if (e.target === closeBtn || e.target.closest('.gallery-close')) return;
    
    const touches = e.touches;
    
    if (touches.length === 1) {
      // 单指触摸
      touchStartX = touches[0].clientX;
      touchStartY = touches[0].clientY;
      
      // 检测双击
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTapTime;
      if (tapLength < 300 && tapLength > 0) {
        handleDoubleClick(e);
        lastTapTime = 0;
        return;
      }
      lastTapTime = currentTime;
      
      if (scale > 1) {
        // 已放大，进入拖拽模式
        isDragging = true;
        isSwiping = false;
        dragStartX = touches[0].clientX - translateX;
        dragStartY = touches[0].clientY - translateY;
      } else {
        // 未放大，进入滑动模式
        isSwiping = true;
        isDragging = false;
      }
    } else if (touches.length === 2) {
      // 双指触摸 - 准备缩放
      e.preventDefault();
      isPinching = true;
      isSwiping = false;
      isDragging = false;
      initialDistance = getDistance(touches[0], touches[1]);
      lastScale = scale;
      lastTranslateX = translateX;
      lastTranslateY = translateY;
      
      // 计算两指中心点
      const centerX = (touches[0].clientX + touches[1].clientX) / 2;
      const centerY = (touches[0].clientY + touches[1].clientY) / 2;
      dragStartX = centerX;
      dragStartY = centerY;
    }
  }

  // 触摸移动
  function handleTouchMove(e) {
    if (e.target === closeBtn || e.target.closest('.gallery-close')) return;
    
    const touches = e.touches;
    
    if (touches.length === 1 && isDragging && scale > 1) {
      // 单指拖拽
      e.preventDefault();
      translateX = touches[0].clientX - dragStartX;
      translateY = touches[0].clientY - dragStartY;
      updateTransform();
    } else if (touches.length === 1 && isSwiping) {
      // 记录滑动位置
      touchEndX = touches[0].clientX;
      touchEndY = touches[0].clientY;
    } else if (touches.length === 2 && isPinching) {
      // 双指缩放
      e.preventDefault();
      const currentDistance = getDistance(touches[0], touches[1]);
      const scaleChange = currentDistance / initialDistance;
      const newScale = Math.min(Math.max(lastScale * scaleChange, 0.5), 5);
      
      // 计算缩放中心
      const centerX = (touches[0].clientX + touches[1].clientX) / 2;
      const centerY = (touches[0].clientY + touches[1].clientY) / 2;
      
      // 计算新的平移值（保持缩放中心不变）
      if (newScale !== scale) {
        const scaleRatio = newScale / scale;
        translateX = centerX - (centerX - translateX) * scaleRatio;
        translateY = centerY - (centerY - translateY) * scaleRatio;
      }
      
      scale = newScale;
      updateTransform();
      updateZoomControls();
    }
  }

  // 触摸结束
  function handleTouchEnd(e) {
    if (isPinching) {
      isPinching = false;
      // 缩放结束后，如果缩放小于1.1，自动重置
      if (scale < 1.1) {
        resetZoom();
      }
      return;
    }
    
    if (isDragging) {
      isDragging = false;
      return;
    }
    
    if (!isSwiping) return;
    
    isSwiping = false;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // 判断是否为有效滑动（距离大于50px）
    if (absX < 50 && absY < 50) return;

    // 垂直滑动：关闭画廊（向下滑动关闭）
    if (absY > absX && deltaY > 0) {
      closeGallery();
      return;
    }

    // 水平滑动：切换图片
    if (absX > absY) {
      if (deltaX > 0) {
        showPreviousImage();
      } else {
        showNextImage();
      }
    }

    // 重置
    touchStartX = 0;
    touchStartY = 0;
    touchEndX = 0;
    touchEndY = 0;
  }

  // 计算两指距离
  function getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // 鼠标滚轮缩放
  function handleWheel(e) {
    if (!galleryImage) return;
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.min(Math.max(scale + delta, 0.5), 5);
    
    if (newScale !== scale) {
      // 以鼠标位置为中心缩放
      const rect = galleryImage.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      const scaleRatio = newScale / scale;
      translateX = x - (x - translateX) * scaleRatio;
      translateY = y - (y - translateY) * scaleRatio;
      
      scale = newScale;
      updateTransform();
      updateZoomControls();
    }
  }

  // 鼠标按下
  function handleMouseDown(e) {
    if (scale <= 1) return;
    
    e.preventDefault();
    isDragging = true;
    dragStartX = e.clientX - translateX;
    dragStartY = e.clientY - translateY;
    galleryImage.style.cursor = 'grabbing';
  }

  // 鼠标移动
  function handleMouseMove(e) {
    if (!isDragging || scale <= 1) return;
    
    e.preventDefault();
    translateX = e.clientX - dragStartX;
    translateY = e.clientY - dragStartY;
    updateTransform();
  }

  // 鼠标松开
  function handleMouseUp(e) {
    if (isDragging) {
      isDragging = false;
      if (galleryImage) {
        galleryImage.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
      }
    }
  }

  // 双击缩放
  function handleDoubleClick(e) {
    if (e) e.preventDefault();
    
    if (scale > 1) {
      // 已放大，缩小回原始大小
      resetZoom();
    } else {
      // 放大到2倍
      scale = 2;
      
      // 如果有鼠标事件，以点击位置为中心缩放
      if (e && e.clientX && e.clientY && galleryImage) {
        const rect = galleryImage.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        translateX = -x;
        translateY = -y;
      } else {
        translateX = 0;
        translateY = 0;
      }
      
      updateTransform();
      updateZoomControls();
    }
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
