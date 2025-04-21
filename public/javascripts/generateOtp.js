

// Unified flash message function (single declaration)
function showFlash(message, type = "success") {
  // Remove any existing flash messages first
  document.querySelectorAll('.flash-message').forEach(el => el.remove());
  
  const flash = document.createElement("div");
  flash.className = `flash-message ${type === "success" ? "alert-success" : "alert-danger"}`;
  flash.innerHTML = `
    <span>${message}</span>
    <button class="close-btn" onclick="this.parentElement.remove();">&times;</button>
  `;


  // Auto-remove after delay
  setTimeout(() => {
    flash.style.opacity = "0";
    setTimeout(() => flash.remove(), 500);
  }, 5000);
}

// Registration Form Handler
document.getElementById("registrationForm")?.addEventListener("submit", async function(event) {
  event.preventDefault();

  const formData = new FormData(this);
  const sendBtn = document.getElementById("sendOtpBtn");
  const originalBtnText = sendBtn.textContent;
  
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
      throw new Error(result.message || "Failed to send OTP");
    }
  } catch (error) {
    console.error("Error:", error);
    showFlash(error.message || "Something went wrong. Please try again.", "error");
  } finally {
    sendBtn.textContent = originalBtnText;
    sendBtn.disabled = false;
  }
});

// OTP Verification Handler
document.getElementById("verifyOtpBtn")?.addEventListener("click", async function() {
  const otp = document.getElementById("otp").value.trim();
  const email = document.getElementById("otpEmail").textContent.trim();
  const verifyBtn = this;
  const originalBtnText = verifyBtn.textContent;
  
  // Validation
  if (!otp || !email) {
    showFlash("Please enter OTP and ensure email is correct", "error");
    return;
  }

  verifyBtn.textContent = "Verifying...";
  verifyBtn.disabled = true;

  try {
    const response = await fetch("/user/verify-otp", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ otp, email }),
      credentials: "include"
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Verification failed");
    }

    showFlash("Registration successful! Redirecting...", "success");
    setTimeout(() => {
      window.location.href = result.redirectUrl || "/";
    }, 2000);
    
  } catch (error) {
    console.error("Verification error:", error);
    showFlash(error.message || "Invalid OTP. Please try again.", "error");
  } finally {
    verifyBtn.textContent = originalBtnText;
    verifyBtn.disabled = false;
  }
});

// Resend OTP Handler (THIS IS THE MISSING PART)
document.getElementById("resendOtpBtn")?.addEventListener("click", async function() {
  const resendBtn = this;
  const email = document.getElementById("otpEmail").textContent.trim();
  const originalBtnText = resendBtn.textContent;
  
  if (!email) {
    showFlash("No email found for OTP resend", "error");
    return;
  }

  resendBtn.textContent = "Resending...";
  resendBtn.disabled = true;

  try {
    const response = await fetch("/user/resend-otp", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Failed to resend OTP");
    }

    showFlash("New OTP has been sent to your email", "success");
    
  } catch (error) {
    console.error("Resend error:", error);
    showFlash(error.message || "Failed to resend OTP. Please try again.", "error");
  } finally {
    resendBtn.textContent = originalBtnText;
    resendBtn.disabled = false;
  }
});

// Auto-remove server-side flash messages
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.querySelectorAll('.flash-message').forEach(msg => {
      msg.style.opacity = '0';
      setTimeout(() => msg.remove(), 300);
    });
  }, 5000);
});
