

const flashContainer = document.getElementById("flashContainer");

function showFlash(message, type = "success") {
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

// ADD THIS DEBUG LINE RIGHT HERE:
console.log("Send OTP button exists:", !!document.getElementById("sendOtpBtn"));

// Then continue with the rest of your code:
function debug(message) {
  console.log("[DEBUG]", message);
  showFlash(message, "success");
}

document.getElementById("registrationForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  const formData = new FormData(this);
  const sendBtn = document.getElementById("sendOtpBtn");
  sendBtn.textContent = "Sending OTP...";
  sendBtn.disabled = true;

  try {
    const response = await fetch("/user/register", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      showFlash("OTP sent to your email. Please verify it.", "success");
      document.getElementById("otpVerification").style.display = "block";
      document.getElementById("otpEmail").textContent = formData.get("email");
      document.getElementById("registrationForm").style.display = "none";
    } else {
      showFlash(result.message || "Something went wrong.", "error");
      sendBtn.textContent = "Send OTP";
      sendBtn.disabled = false;
    }
  } catch (error) {
    console.error("Error:", error);
    showFlash("Something went wrong. Please try again.", "error");
    sendBtn.textContent = "Send OTP";
    sendBtn.disabled = false;
  }
});

document.getElementById("verifyOtpBtn").addEventListener("click", async function () {
  const otp = document.getElementById("otp").value;
  const email = document.getElementById("otpEmail").textContent; // Get email from the displayed text
  
  const verifyBtn = this;
  verifyBtn.textContent = "Verifying...";
  verifyBtn.disabled = true;

  try {
    const response = await fetch("/user/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp, email }), // Include both OTP and email
    });

    const result = await response.json();

    if (result.success) {
      showFlash("Registration successful! Redirecting...", "success");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } else {
      showFlash(result.message || "Invalid OTP.", "error");
      verifyBtn.textContent = "Verify OTP";
      verifyBtn.disabled = false;
    }
  } catch (error) {
    console.error("Error:", error);
    showFlash("Something went wrong. Please try again.", "error");
    verifyBtn.textContent = "Verify OTP";
    verifyBtn.disabled = false;
  }
});

document.getElementById("resendOtpBtn").addEventListener("click", async function () {
  const resendBtn = this;
  const email = document.getElementById("otpEmail").textContent;
  
  resendBtn.textContent = "Resending...";
  resendBtn.disabled = true;

  try {
    const response = await fetch("/user/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (result.success) {
      showFlash("New OTP has been sent to your email.", "success");
    } else {
      showFlash(result.message || "Failed to resend OTP.", "error");
    }
  } catch (error) {
    console.error("Error:", error);
    showFlash("Failed to resend OTP. Please try again.", "error");
  } finally {
    resendBtn.textContent = "Resend OTP";
    resendBtn.disabled = false;
  }
});
