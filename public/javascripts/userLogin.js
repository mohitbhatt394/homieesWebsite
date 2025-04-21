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
document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const form = this;
  const registerBtn = document.getElementById("loginBtn");
  registerBtn.textContent = "Logging...";
  registerBtn.disabled = true;

  const data = {
    email: form.email.value,
    password: form.password.value,
  };
  

  try {
    const response = await fetch("/user/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      "Accept": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      showFlash(result.message || "Logged in successful", "success");

      // Wait for 1.5 seconds before redirecting
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } else {
      showFlash(result.message || "logged in failed", "error");

      // 🔧 Re-enable the button on error
      registerBtn.textContent = "Login";
      registerBtn.disabled = false;
    }
  } catch (error) {
    console.error("Update Error:", error);
    showFlash(error.message || "Something went wrong. Please try again.", "error");

     // 🔧 Re-enable the button on catch error
     registerBtn.textContent = "Login";
     registerBtn.disabled = false;
  } 
});

