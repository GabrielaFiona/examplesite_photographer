// Navigation Functionality
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    const activePage = document.getElementById(pageId);
    activePage.classList.add('active');
    
    // Scroll to top when switching
    window.scrollTo(0, 0);
}

// Lightbox Logic
const galleryItems = document.querySelectorAll('.gallery-item img');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');

galleryItems.forEach(img => {
    img.addEventListener('click', () => {
        lightbox.style.display = 'flex';
        lightboxImg.src = img.src;
    });
});

// Simple Form Submission (Prevents refresh)
document.getElementById('contact-form').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Thank you for your inquiry. Lumina will reach out shortly.');
});

// Initial Load Animation Trigger
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('home').classList.add('active');
});
