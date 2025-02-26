document.addEventListener("DOMContentLoaded",function() {

    // Get the elements you need
    const ratingsDiv = document.querySelector('.ratings');
    const ratingContainerDiv = document.querySelector('.other-rating-container');
    const editBtn = document.getElementById('editbtn');
    const submitChangesBtn = document.getElementById('submitChanges');
    const selectedRatingInput = document.getElementById('selected-rating');
  
    // Add a click event listener to the "editbtn"
    editBtn.addEventListener('click', function() {
      // Show the "rating-container" and hide the "ratings" div
      ratingContainerDiv.classList.remove('hidden');
      ratingsDiv.classList.add('hidden');
    });
  
    // Add a click event listener to the "submitChanges" button
    submitChangesBtn.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent form submission if applicable
      
        // // Get the data-rating value from the selectedRatingInput
        // const dataRating = parseInt(selectedRatingInput.value, 10);
      
        // // Show the "ratings" div and hide the "rating-container" div
        // ratingContainerDiv.classList.add('hidden');
        // ratingsDiv.classList.remove('hidden');
      
        // // Update the displayed images based on the data-rating value
        // const fullImages = dataRating;
        // const emptyImages = 5 - dataRating;
        // const fullImageHTML = '<img src="../../images/ratings/full.png" />';
        // const emptyImageHTML = '<img src="../../images/ratings/empty.png" />';
      
        // let ratingsHTML = '';
      
        // for (let i = 0; i < fullImages; i++) {
        //   ratingsHTML += fullImageHTML;
        // }
        // for (let i = 0; i < emptyImages; i++) {
        //   ratingsHTML += emptyImageHTML;
        // }
        // ratingsDiv.innerHTML = ratingsHTML;
      
        // // Get review title and review text from elements with class "editable"
        // const editableForms = document.querySelectorAll(".editable");
        // const review_title = editableForms[0].children[0].textContent.trim();
        // const review = editableForms[1].children[0].textContent.trim();
      
        // // Instead of chaining multiple parentElement calls, use a more specific selector:
        // // For example, if the parent container has a class "review-container" and the review id is stored in an element with class "review-id":
        // const parent = this.closest('.review-container');
        // const review_id = parent.querySelector('.review-id').textContent.trim();
      
        // const rating = selectedRatingInput.value;
        

        // fetch('/editReview', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json'
        //   },
        //   body: JSON.stringify({ review_id, review_title, review, rating })
        // })
        // .then(response => {
        //   if (response.ok) {
        //     return response.json();
        //   } else {
        //     throw new Error('Network response was not ok.');
        //   }
        // })
        // .then(data => {
        //   console.log(data);
        //   location.reload();
        // })
        // .catch(error => {
        //   console.error("An error has occurred:", error);
        // });
        console.log("submit changes clicked");
      });
      

    const deleteBtn = document.getElementById("deletebtn");



    //ALTERNATIVE EDIT
    document.addEventListener("DOMContentLoaded", function() {
        const editBtn2 = document.getElementById("edit-review");
      
        editBtn2.addEventListener("click", function(event) {
          event.preventDefault(); // Prevent default form submission
      
          console.log("edit clicked");
      
          // Retrieve input values
          const review_title = document.querySelector("#review-title").value;
          const review = document.querySelector("#review-editor").value;
          const rating = document.querySelector("#selected-rating").value;
          const media = document.querySelector("#formFile").value;
          
          // Retrieve review_id either from a hidden input or div
          const reviewIdElement = document.getElementById("review_id");
          let review_id = "";
          // Try value first, then innerHTML/textContent
          if (reviewIdElement.value !== undefined) {
            review_id = reviewIdElement.value;
          } else {
            review_id = reviewIdElement.textContent.trim();
          }
          
          // Get the old rating element more robustly
          const oldRatingDiv = document.getElementById(review_id);
          if (!oldRatingDiv) {
            console.error("Old rating container not found for review id:", review_id);
            return;
          }
          const oldRatingElement = oldRatingDiv.querySelector("[data-rate]");
          if (!oldRatingElement) {
            console.error("Element with data-rate attribute not found");
            return;
          }
          const oldRating = oldRatingElement.getAttribute("data-rate");
          console.log("editbtn2 clicked");

          // Send data to the server
          fetch('/editReview', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ review_id, review_title, review, rating, media, oldRating })
          })
          .then(response => {
            if (response.ok) {
              return response.json(); // Optionally, process returned data
            } else {
              return response.text().then(text => { throw new Error(text); });
            }
          })
          .then(data => {
            console.log("Success:", data);
            location.reload();
          })
          .catch(error => {
            console.error("An error has occurred:", error);
          });
        });
      });
}
);      

function updateRating(rating, review_id){
    const review = document.getElementById(review_id);
    const rating1 = review.children[0].children[1].children[2];
    const rating2 = review.children[0].children[1].children[3];
    const rating3 = review.children[0].children[1].children[4];
    const rating4 = review.children[0].children[1].children[5];
    const rating5 = review.children[0].children[1].children[6];

    console.log(rating1);
    console.log(rating2);
    console.log(rating3);
    console.log(rating4);
    console.log(rating5);

}