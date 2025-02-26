document.addEventListener("DOMContentLoaded", () => {
    let loading = false;
    let reviewTemplate;
    let reviewCount = 0;

    async function loadTemplate() {
        try {
            const response = await fetch('/partials/review.hbs');
            if (!response.ok) {
                throw new Error('Failed to load review template.');
            }
            const templateText = await response.text();
            reviewTemplate = Handlebars.compile(templateText);
        } catch (error) {
            console.error("Error loading template:", error);
        }
    }


    async function fetchReviews() {
        if (loading) return;
        loading = true;
        if (stopFetching) return;
        fetch(`/cafe/get/review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reviewCount, cafeName })
        })
            .then(response => response.json())
            .then(data => {
                if (data.reviews && data.reviews.length > 0) {
                    data.reviews.forEach(reviewData => {
                        const reviewHTML = reviewTemplate(reviewData);
                        document.querySelector(".content_review").insertAdjacentHTML('beforeend', reviewHTML);
                    });
                    reviewCount++;
                    loading = false;
                } else {
                    stopFetching = true;
                }
            })

    }

    function handleScroll() {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
            fetchReviews();
        }
    }

    loadTemplate().then(() => {
        window.addEventListener("scroll", handleScroll);
    });
});
