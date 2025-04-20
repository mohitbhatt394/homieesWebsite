document.addEventListener('DOMContentLoaded', () => {
  const reviewButtons = document.querySelectorAll('.review-button')
  const reviewsToggleButtons = document.querySelectorAll('.reviews-toggle')
  const reviewModal = document.getElementById('reviewFormModal')
  const reviewsModal = document.getElementById('reviewsModal')
  const modalCloses = document.querySelectorAll('.modal-close')
  const providerIdInput = document.getElementById('reviewProviderId')
  const reviewForm = document.querySelector('.review-form')
  const ratingStars = document.querySelectorAll('.star-rating i')
  const reviewsContainer = document.querySelector('.reviews-container')

  let selectedRating = 0
  let currentProviderId = null

  function showFlashMessage(message, type = "success") {
    const flashContainer = document.createElement("div");
    flashContainer.classList.add("flash-message", type === "success" ? "alert-success" : "alert-danger");
    flashContainer.innerHTML = `
        <span>${message}</span>
        <button class="close-btn" onclick="this.parentElement.style.display='none';">&times;</button>
    `;
    
    document.body.appendChild(flashContainer);
  
    setTimeout(() => {
        flashContainer.style.opacity = "0";
        setTimeout(() => flashContainer.remove(), 500);
    }, 4000);
  }

  // Open review modal and change URL
  reviewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const providerCard = button.closest('.provider-card')
      currentProviderId = providerCard
        ? providerCard.getAttribute('data-provider-id')
        : null

      if (!currentProviderId) {
        console.error('Provider ID is undefined.')
        return
      }

      providerIdInput.value = currentProviderId
      reviewForm.setAttribute('action', `/review/${currentProviderId}`)

      history.pushState(
        { providerId: currentProviderId },
        '',
        `/provider/${currentProviderId}`
      )

      reviewModal.classList.add('active')
    })
  })

  // Open reviews modal and change URL
  reviewsToggleButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const providerCard = button.closest('.provider-card')
      currentProviderId = providerCard
        ? providerCard.getAttribute('data-provider-id')
        : null

      if (!currentProviderId) {
        console.error('Provider ID is undefined.')
        return
      }

      await loadReviews(currentProviderId)

      history.pushState(
        { providerId: currentProviderId },
        '',
        `/provider/${currentProviderId}/reviews`
      )

      reviewsModal.classList.add('active')
    })
  })

  // Handle Star Rating Clicks
  ratingStars.forEach((star) => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.getAttribute('data-rating')) // Store selected rating
      document
        .querySelectorAll('.star-rating i')
        .forEach((s) => s.classList.replace('fas', 'far'))
      for (let i = 1; i <= selectedRating; i++) {
        document
          .querySelector(`.star-rating i[data-rating="${i}"]`)
          .classList.replace('far', 'fas')
      }
    })
  })

  // Close modal and reset URL
  modalCloses.forEach((close) => {
    close.addEventListener('click', () => {
      history.back() // Instead of hardcoding a URL
      reviewModal.classList.remove('active')
      reviewsModal.classList.remove('active')
    })
  })

  // Handle review submission
reviewForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = reviewForm.querySelector('.submit-review');
  submitButton.disabled = true; // Disable button to prevent multiple submissions

  const reviewText = document.querySelector('.review-textarea').value.trim();
  if (!selectedRating ) {
      showFlashMessage('Please provide a rating', 'error');
      submitButton.disabled = false; // Re-enable if validation fails
      return;
  }

  try {
      const response = await fetch(`/provider/${currentProviderId}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              rating: selectedRating,
              reviewMessage: reviewText || "", // Send null if empty string
          }),
      });

      const data = await response.json(); // Get the JSON response from the backend

      if (response.ok) {
          showFlashMessage(data.flashMessage, 'success');

          reviewModal.classList.remove('active');
          document.querySelector('.review-textarea').value = '';
          selectedRating = 0;
          ratingStars.forEach((star) => star.classList.replace('fas', 'far'));

           history.back() // Close the modal and go back
      } else {
          showFlashMessage(data.flashMessage, 'error');
      }
  } catch (error) {
      console.error('Error:', error);
      showFlashMessage('Something went wrong. Please try again.', 'error');
  } finally {
      submitButton.disabled = false; // Re-enable button after submission
  }
});


  // Handle back/forward browser navigation
  window.addEventListener('popstate', () => {
    reviewModal.classList.remove('active')
    reviewsModal.classList.remove('active')
  })

  // Load reviews dynamically
  async function loadReviews(providerId) {
    try {
      const response = await fetch(`/provider/${providerId}/reviews`)
      // console.log('Response Status:', response.status)
      // console.log('Response Headers:', [...response.headers])

      if (!response.ok) throw new Error('Failed to fetch reviews')

      const reviews = await response.json()
      reviewsContainer.innerHTML = '' // Clear existing content

      if (reviews.length === 0) {
        reviewsContainer.innerHTML = '<p>No reviews available.</p>'
        return
      }

      reviews.forEach((review) => {
        const reviewElement = document.createElement('div')
        reviewElement.classList.add('review-item')
        reviewElement.innerHTML = `
                    <div class="userProfile">
                    <img src="${review.userId?.picture}" 
     alt="${review.userId?.fullname || 'Anonymous'}" 
     class="user-profile">

                    </div>
                    <p><strong>${
                      review.userId.fullname || 'Anonymous'
                    }</strong></p>
                    <p><strong>Rating:</strong> ${'⭐'.repeat(
                      review.rating
                    )} (${review.rating}/5)</p>
                    <p>${review.reviewMessage}</p>
                    <hr>
                `
        reviewsContainer.appendChild(reviewElement)
      })
    } catch (error) {
      console.error('Error loading reviews:', error)
      reviewsContainer.innerHTML = '<p>Failed to load reviews.</p>'
    }
  }

  
});




