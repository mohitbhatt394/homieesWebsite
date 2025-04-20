function showFlash(message, type = "success") {
  // Remove any existing flash messages first
  const existingFlash = document.querySelector('.flash-message');
  if (existingFlash) {
      existingFlash.remove();
  }

  const flash = document.createElement("div");
  flash.className = `flash-message ${type === "success" ? "alert-success" : "alert-danger"}`;
  flash.style.opacity = "0"; // Start invisible
  flash.innerHTML = `
    <span>${message}</span>
    <button class="close-btn" onclick="this.parentElement.remove();">&times;</button>
  `;
  document.body.appendChild(flash);

  // Force reflow to enable transition
  void flash.offsetWidth;
  
  // Fade in
  flash.style.opacity = "1";

  return flash; // Return the element reference
}

document.getElementById("userProfileUpdate").addEventListener("submit", async function (e) {
  e.preventDefault();
  const form = this;
  const registerBtn = document.getElementById("userProfileUpdateBtn");
  registerBtn.textContent = "updating...";
  registerBtn.disabled = true;

  const formData = new FormData(form);

  try {
      const response = await fetch("/user/profile/update", {
          method: "POST",
          body: formData,
          headers: {
              'Accept': 'application/json'
          }
      });

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'updation failed');
      }

      const result = await response.json();

      if (result.success) {
          const flashElement = showFlash(result.message || "User profile updated successfully", "success");
          
          // Wait for flash message to be fully visible before starting redirect countdown
          setTimeout(() => {
              // Fade out before redirect
              flashElement.style.opacity = "0";
              setTimeout(() => {
                  window.location.href = "/user/profile";
              }, 500); // Wait for fade-out to complete
          }, 2500); // Show message for 2.5 seconds before starting fade-out
      } else {
          showFlash(result.message || "Updation failed", "error");
          registerBtn.textContent = "Save Changes";
          registerBtn.disabled = false;
      }
  } catch (error) {
      console.error("updation Error:", error);
      showFlash(error.message || "Something went wrong. Please try again.", "error");
      registerBtn.textContent = "Save Changes";
      registerBtn.disabled = false;
  }
});