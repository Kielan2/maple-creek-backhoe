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

    // Tab Switching Functionality
    $('.tab-btn').on('click', function() {
        var targetTab = $(this).data('tab');

        // Remove active class from all buttons and content
        $('.tab-btn').removeClass('active');
        $('.tab-content').removeClass('active');

        // Add active class to clicked button and corresponding content
        $(this).addClass('active');
        $('#' + targetTab + '-tab').addClass('active');
    });

    // Handle navigation link to estimator
    $('a[href="#estimator-form"]').on('click', function(e) {
        e.preventDefault();

        // Scroll to contact section
        $('html, body').stop().animate({
            scrollTop: $('#contact').offset().top - 70
        }, 800, function() {
            // After scrolling, switch to estimator tab
            $('.tab-btn').removeClass('active');
            $('.tab-content').removeClass('active');

            $('.tab-btn[data-tab="estimator"]').addClass('active');
            $('#estimator-tab').addClass('active');
        });
    });

    // Estimator Calculator
    $('#calculate-estimate').on('click', function() {
        var aggregateType = parseFloat($('#aggregate-type').val());
        var pounds = parseFloat($('#pounds').val());
        var miles = parseFloat($('#miles').val());

        // Validate inputs
        if (!aggregateType || !pounds || !miles) {
            alert('Please fill in all fields.');
            return;
        }

        // Calculate costs
        var materialCost = aggregateType * pounds;
        var deliveryCost = miles * 0.10; // $0.10 per mile
        var totalCost = materialCost + deliveryCost;

        // Display results
        $('#material-cost').text('$' + materialCost.toFixed(2));
        $('#delivery-cost').text('$' + deliveryCost.toFixed(2));
        $('#total-cost').text('$' + totalCost.toFixed(2));

        // Hide form and show results
        gsap.to('#estimator-form', {
            duration: 0.4,
            opacity: 0,
            y: -20,
            onComplete: function() {
                $('#estimator-form').hide();
                $('#estimate-result').removeClass('hidden');

                // Ensure estimate result is ready for animation
                gsap.set('#estimate-result', { opacity: 1, y: 0 });

                // Animate the result appearing
                gsap.fromTo('#estimate-result',
                    { opacity: 0, y: 20 },
                    {
                        duration: 0.6,
                        opacity: 1,
                        y: 0,
                        ease: 'power3.out'
                    }
                );
            }
        });
    });

    // Recalculate button - show form again
    $(document).on('click', '#recalculate-estimate', function() {
        gsap.to('#estimate-result', {
            duration: 0.4,
            opacity: 0,
            y: -20,
            onComplete: function() {
                $('#estimate-result').addClass('hidden');
                // Reset estimate result styles
                gsap.set('#estimate-result', { opacity: 1, y: 0 });

                $('#estimator-form').show();

                // Reset inline styles before animating
                gsap.set('#estimator-form', { opacity: 1, y: 0 });

                // Animate the form appearing
                gsap.fromTo('#estimator-form',
                    { opacity: 0, y: 20 },
                    {
                        duration: 0.6,
                        opacity: 1,
                        y: 0,
                        ease: 'power3.out'
                    }
                );
            }
        });
    });

    // Go to Contact button - switch to contact tab
    $(document).on('click', '#goto-contact', function() {
        // Switch to contact tab
        $('.tab-btn').removeClass('active');
        $('.tab-content').removeClass('active');

        $('.tab-btn[data-tab="contact"]').addClass('active');
        $('#contact-tab').addClass('active');

        // Reset estimator for next time
        $('#estimate-result').addClass('hidden');
        $('#estimator-form').show();
        gsap.set('#estimator-form', { opacity: 1, y: 0 });
    });

    // Set Web3Forms access key from config
    $('#web3forms-key').val(CONFIG.WEB3FORMS_ACCESS_KEY);

    // Form Submission with Web3Forms
    $('#contact-form').on('submit', function(e) {
        e.preventDefault();

        var form = $(this);
        var btn = form.find('button[type="submit"]');
        var originalText = btn.text();

        // Disable button and show loading state
        btn.text('Sending...').prop('disabled', true);

        // Submit to Web3Forms
        var formData = new FormData(form[0]);

        fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            body: formData
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.success) {
                // Hide form and show success message
                gsap.to('#contact-form', {
                    duration: 0.4,
                    opacity: 0,
                    y: -20,
                    onComplete: function() {
                        $('#contact-form').hide();
                        $('#contact-success').removeClass('hidden');

                        // Reset form
                        form[0].reset();
                        $('#web3forms-key').val(CONFIG.WEB3FORMS_ACCESS_KEY);

                        // Ensure success message is ready for animation
                        gsap.set('#contact-success', { opacity: 1, y: 0 });

                        // Animate the success message appearing
                        gsap.fromTo('#contact-success',
                            { opacity: 0, y: 20 },
                            {
                                duration: 0.6,
                                opacity: 1,
                                y: 0,
                                ease: 'power3.out'
                            }
                        );
                    }
                });
            } else {
                alert('Oops! Something went wrong. Please try again.');
            }
        })
        .catch(function(error) {
            console.error('Error:', error);
            alert('Oops! Something went wrong. Please try again.');
        })
        .finally(function() {
            // Re-enable button
            btn.text(originalText).prop('disabled', false);
        });
    });

    // Send Another Message button - show form again
    $(document).on('click', '#send-another', function() {
        gsap.to('#contact-success', {
            duration: 0.4,
            opacity: 0,
            y: -20,
            onComplete: function() {
                $('#contact-success').addClass('hidden');
                gsap.set('#contact-success', { opacity: 1, y: 0 });

                $('#contact-form').show();

                // Reset inline styles before animating
                gsap.set('#contact-form', { opacity: 1, y: 0 });

                // Animate the form appearing
                gsap.fromTo('#contact-form',
                    { opacity: 0, y: 20 },
                    {
                        duration: 0.6,
                        opacity: 1,
                        y: 0,
                        ease: 'power3.out'
                    }
                );
            }
        });
    });
});
