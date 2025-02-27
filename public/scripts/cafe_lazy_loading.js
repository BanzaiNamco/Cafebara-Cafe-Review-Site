document.addEventListener("DOMContentLoaded", () => {
    let loading = false;
    let reviewTemplate;
    let reviewCount = 3;

    async function loadProfileTemplate() {
        try {
            const response = await fetch('/partials/ownerProfileReview.hbs');
            if (!response.ok) {
                throw new Error('Failed to load review template.');
            }
            const templateText = await response.text();
            reviewTemplate = Handlebars.compile(templateText);
        } catch (error) {
            console.error("Error loading template:", error);
        }
    }


    async function fetchProfileReviews() {
        if (loading) return;
        loading = true;
        if (stopFetching) return;
        fetch(`/profile/get/review`, {
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
                        document.querySelector("#profileReviewController").insertAdjacentHTML('beforeend', reviewHTML);
                        reviewCount++;
                        let newSubmitReview = document.querySelector('.new-submit-review');
                        if (newSubmitReview) {
                            newSubmitReview.addEventListener('click', function () {
                                const reviewcontainer = this.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
                                const reviewID = reviewcontainer.children[3].children[0].innerHTML;
                                const reply = this.parentElement.children[0].children[0].value;
                                fetch('/reply', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ 'reviewId': reviewID, 'reply': reply })
                                })
                                    .then(response => {
                                        if (response.status == 200)
                                            location.reload();
                                        else
                                            alert("Error");
                                    }
                                    )

                            });

                            newSubmitReview.classList.remove('new-submit-review');
                        }
                    });
                } else {
                    stopFetching = true;
                }
                loading = false;
            })

    }

    function handleProfileScroll() {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
            fetchProfileReviews();
        }
    }

    loadProfileTemplate().then(() => {
        window.addEventListener("scroll", handleProfileScroll);
    });
});
