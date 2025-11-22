$(document).ready(function() {
    
    // Set current year in footer
    $('#current-year').text(new Date().getFullYear());
    
    // Mobile Menu Toggle
    $('.mobile-menu-toggle').on('click', function() {
        $('#main-nav').toggleClass('active');
        $(this).toggleClass('active');
        
        // Animate hamburger to X
        if ($(this).hasClass('active')) {
            $('.bar:nth-child(1)').css('transform', 'rotate(45deg) translate(5px, 5px)');
            $('.bar:nth-child(2)').css('opacity', '0');
            $('.bar:nth-child(3)').css('transform', 'rotate(-45deg) translate(7px, -6px)');
        } else {
            $('.bar').css('transform', 'none');
            $('.bar:nth-child(2)').css('opacity', '1');
        }
    });

    // Close mobile menu when a link is clicked
    $('#main-nav a').on('click', function() {
        $('#main-nav').removeClass('active');
        $('.mobile-menu-toggle').removeClass('active');
        $('.bar').css('transform', 'none');
        $('.bar:nth-child(2)').css('opacity', '1');
    });

    // Smooth Scrolling
    $('a[href^="#"]').on('click', function(event) {
        var target = $(this.getAttribute('href'));
        if( target.length ) {
            event.preventDefault();
            $('html, body').stop().animate({
                scrollTop: target.offset().top - 70 // Adjust for header height
            }, 800);
        }
    });

    // Sticky Header Effect
    $(window).scroll(function() {
        if ($(this).scrollTop() > 50) {
            $('#main-header').css('box-shadow', '0 2px 10px rgba(0,0,0,0.2)');
        } else {
            $('#main-header').css('box-shadow', '0 2px 5px rgba(0,0,0,0.1)');
        }
    });

    // GSAP Animations
    gsap.registerPlugin(ScrollTrigger);

    // Hero Animation
    var heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    
    heroTl.from('.hero-content h1', {
        duration: 1,
        y: 50,
        opacity: 0,
        delay: 0.2
    })
    .from('.hero-content p', {
        duration: 1,
        y: 30,
        opacity: 0
    }, '-=0.6')
    .from('.hero-content .btn-primary', {
        duration: 0.8,
        y: 20,
        opacity: 0,
        scale: 0.9,
        onComplete: function() {
            gsap.set(this.targets(), { clearProps: "all" });
        }
    }, '-=0.6');

    // Removed Parallax Hero Background to prevent glitching

    // Services Animation
    gsap.set('.service-card', { y: 100, opacity: 0 }); // Set initial state
    gsap.set('#services .section-header', { y: 50, opacity: 0 }); // Set initial state for header

    ScrollTrigger.create({
        trigger: '#services .section-header',
        start: 'top 70%',
        onEnter: () => gsap.to('#services .section-header', {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out',
            overwrite: true
        }),
        onLeaveBack: () => gsap.to('#services .section-header', {
            y: 50,
            opacity: 0,
            overwrite: true
        })
    });
    
    ScrollTrigger.batch('.service-card', {
        start: 'top 85%',
        onEnter: batch => gsap.to(batch, {
            opacity: 1, 
            y: 0, 
            stagger: 0.15, 
            duration: 1, 
            ease: 'back.out(1.2)', 
            overwrite: true 
        }),
        onLeaveBack: batch => gsap.to(batch, {
            opacity: 0, 
            y: 100, 
            overwrite: true
        })
    });

    // About Animation
    // Set initial state
    gsap.set('.about-text', { x: -50, opacity: 0 });
    gsap.set('.about-image', { x: 50, opacity: 0 });

    ScrollTrigger.create({
        trigger: '#about',
        start: 'top 80%',
        onEnter: () => {
            gsap.to('.about-text', {
                duration: 1.2,
                x: 0,
                opacity: 1,
                ease: 'power3.out',
                overwrite: true
            });
            gsap.to('.about-image', {
                duration: 1.2,
                x: 0,
                opacity: 1,
                ease: 'power3.out',
                delay: 0.2,
                overwrite: true
            });
        },
        onLeaveBack: () => {
            gsap.to('.about-text', {
                duration: 1,
                x: -50,
                opacity: 0,
                ease: 'power3.out',
                overwrite: true
            });
            gsap.to('.about-image', {
                duration: 1,
                x: 50,
                opacity: 0,
                ease: 'power3.out',
                overwrite: true
            });
        }
    });

    // Contact Animation
    gsap.from('.contact-wrapper', {
        scrollTrigger: {
            trigger: '#contact',
            start: 'top 80%',
        },
        duration: 1,
        y: 30,
        opacity: 0,
        ease: 'power3.out'
    });

    // Form Submission (Simulation)
    $('#contact-form').on('submit', function(e) {
        e.preventDefault();
        
        // Basic validation
        var name = $('#name').val();
        var email = $('#email').val();
        var message = $('#message').val();

        if (name && email && message) {
            // Simulate AJAX request
            var btn = $(this).find('button');
            var originalText = btn.text();
            
            btn.text('Sending...').prop('disabled', true);
            
            setTimeout(function() {
                alert('Thank you, ' + name + '! Your message has been sent.');
                $('#contact-form')[0].reset();
                btn.text(originalText).prop('disabled', false);
            }, 1500);
        } else {
            alert('Please fill in all fields.');
        }
    });
});
