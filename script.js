// 1. 导航栏吸顶：滚动时阴影加深，增强层次感
window.addEventListener('scroll', function() {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
    navbar.style.padding = '14px 0';
  } else {
    navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
    navbar.style.padding = '16px 0';
  }
});

// 2. 全局平滑滚动：所有锚点链接跳转更柔和
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});