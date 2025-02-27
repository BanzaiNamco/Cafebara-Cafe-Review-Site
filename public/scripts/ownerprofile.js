document.addEventListener("DOMContentLoaded",function() {
    const reply = document.querySelectorAll(".submit-review");

    for (let i = 0; i < reply.length; i++) {
        reply[i].addEventListener('click', function() {

            const reviewcontainer = this.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
            const reviewID = reviewcontainer.children[3].children[0].innerHTML;
            const reply = this.parentElement.children[0].children[0].value;
            fetch('/reply', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({'reviewId': reviewID, 'reply': reply})
            })
            .then(response => {
                if (response.status == 200)
                    location.reload();
                else
                    alert("Error");
            }
            )
        })
    }
});