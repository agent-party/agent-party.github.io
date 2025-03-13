document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
    
    // Table of contents generation for pages with TOC enabled
    const tocContainer = document.getElementById('toc');
    if (tocContainer) {
        const headings = document.querySelectorAll('.main-content h2, .main-content h3');
        if (headings.length > 0) {
            const toc = document.createElement('ul');
            toc.className = 'toc-list';
            
            headings.forEach((heading, index) => {
                // Add ID to the heading if it doesn't have one
                if (!heading.id) {
                    heading.id = `heading-${index}`;
                }
                
                const listItem = document.createElement('li');
                listItem.className = heading.tagName === 'H3' ? 'toc-subitem' : 'toc-item';
                
                const link = document.createElement('a');
                link.href = `#${heading.id}`;
                link.textContent = heading.textContent;
                
                listItem.appendChild(link);
                toc.appendChild(listItem);
            });
            
            tocContainer.appendChild(toc);
        } else {
            tocContainer.innerHTML = '<p>No table of contents available for this page.</p>';
        }
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.getAttribute('href') !== '#') {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 100, // Offset for fixed header
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Active section highlighting in navigation
    function highlightActiveSection() {
        const sections = document.querySelectorAll('section[id]');
        let scrollPosition = window.scrollY + 200; // Offset
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                document.querySelector(`.nav-link[href*="#${sectionId}"]`)?.classList.add('active');
            } else {
                document.querySelector(`.nav-link[href*="#${sectionId}"]`)?.classList.remove('active');
            }
        });
    }
    
    // Call on scroll if there are sections with IDs
    if (document.querySelectorAll('section[id]').length > 0) {
        window.addEventListener('scroll', highlightActiveSection);
        highlightActiveSection(); // Call once on page load
    }
}); 