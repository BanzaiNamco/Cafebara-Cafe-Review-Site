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
                        let newReview = document.querySelector('.new-review');
                        let readMoreButton = newReview.querySelector('.read-more-btn');
                        if (readMoreButton) {
                            readMoreButton.addEventListener('click', function () {
                                const fullText = this.dataset.fulltext;
                                this.parentNode.innerHTML = `<p>${fullText}</p>`;
                            });
                        };
                        newReview.classList.remove('new-review');
                        let newEdit = document.querySelector('.new-edit');
                        if (newEdit) {
                            newEdit.addEventListener('click', function () {
                                document.getElementById('realEditButton').click();
                            });
                            newEdit.classList.remove('new-edit');
                        }
                        let newDelete = document.querySelector('.new-delete');
                        if (newDelete) {
                            newDelete.addEventListener("click", function () {
                                let div = this.parentElement;
                                for (let i = 0; i < 5; i++) {
                                    div = div.parentElement;
                                }

                                const cafe_id = document.getElementById("cafe_id").innerHTML;

                                fetch('/deleteReview', {
                                    method: "DELETE",
                                    body: JSON.stringify({ cafe_id }),
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                }).then(response => {
                                    location.reload();
                                });

                            });
                            newDelete.classList.remove('new-delete');
                        }
                        let newUP = document.querySelector('.new-up');
                        if (newUP) {
                            newUP.addEventListener("click", function () {
                                const path = newUP.children[0];
                                const parent = newUP.parentElement.parentElement.parentElement.parentElement.parentElement;
                                const review_id = parent.children[1].children[0].innerHTML;
                                const counterUp = newUP.parentElement.children[0];
                                const counterDown = newUP.parentElement.children[2];
                                const downPath = newUP.parentElement.children[3].children[0];

                                fetch('/upvote', {
                                    method: "POST",
                                    body: JSON.stringify({ 'reviewId': review_id }),
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                }).then(response => {
                                    if (response.status == 200) {
                                        upvoteClicked(path, counterUp, counterDown, downPath);
                                    }
                                    else
                                        console.log("Failed to upvote");
                                });
                            })
                            newUP.classList.remove('new-up');
                        }

                        let newDown = document.querySelector('.new-down');
                        if (newDown){
                            newDown.addEventListener("click",function() {
                                const path = newDown.children[0];
                                const parent = newDown.parentElement.parentElement.parentElement.parentElement.parentElement;
                                const review_id = parent.children[1].children[0].innerHTML;
                                const counterUp = newDown.parentElement.children[0];
                                const counterDown = newDown.parentElement.children[2];
                                const upPath = newDown.parentElement.children[1].children[0];
                    
                    
                                fetch('/downvote', {
                                    method: "POST",
                                    body: JSON.stringify({'reviewId' : review_id}),
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                }).then(response => {
                                    if (response.status == 200){
                                        downvoteClicked(path,counterUp, counterDown, upPath);
                                    }
                                    else
                                        console.log("Failed to upvote");
                                });
                            })
                            newDown.classList.remove('new-down');
                        }
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
