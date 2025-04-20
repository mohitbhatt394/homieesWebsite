function showFlash(message, type = "success") {
  const flash = document.createElement("div");
  flash.className = `flash-message ${type === "success" ? "alert-success" : "alert-danger"}`;
  flash.innerHTML = `
    <span>${message}</span>
    <button class="close-btn" onclick="this.parentElement.style.display='none';">&times;</button>
  `;
  document.body.appendChild(flash);

  // Automatically remove the flash message after 4 seconds
  setTimeout(() => {
    flash.style.opacity = "0";
    setTimeout(() => flash.remove(), 500);
  }, 4000);
}

// User profile update form submission
document.getElementById("userProfileUpdate").addEventListener("submit", async function (e) {
  e.preventDefault();
  const form = this;
  const registerBtn = document.getElementById("userProfileUpdateBtn");
  registerBtn.textContent = "Updating...";
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

    const result = await response.json();

    if (response.ok && result.success) {
      showFlash(result.message || "User profile updated successfully", "success");

      // Wait for 1.5 seconds before redirecting
      setTimeout(() => {
        window.location.href = "/user/profile";
      }, 1500);
    } else {
      showFlash(result.message || "Update failed", "error");
    }
  } catch (error) {
    console.error("Update Error:", error);
    showFlash(error.message || "Something went wrong. Please try again.", "error");
  } finally {
    registerBtn.textContent = "Save Changes";
    registerBtn.disabled = false;
  }
});
