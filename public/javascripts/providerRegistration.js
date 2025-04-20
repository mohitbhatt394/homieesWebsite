
function showFlash(message, type = "success") {
  const flash = document.createElement("div");
  flash.className = `flash-message ${type === "success" ? "alert-success" : "alert-danger"}`;
  flash.innerHTML = `
    <span>${message}</span>
    <button class="close-btn" onclick="this.parentElement.style.display='none';">&times;</button>
  `;
  document.body.appendChild(flash);

  setTimeout(() => {
    flash.style.opacity = "0";
    setTimeout(() => flash.remove(), 500);
  }, 4000);
}

// Debugging function
// function debug(message) {
//   console.log("[DEBUG]", message);
//   showFlash(message, "success");
// }

// // Initialize Firebase and reCAPTCHA
// document.addEventListener('DOMContentLoaded', async () => {
//   console.log("DOMContentLoaded fired");
//   console.log("Send OTP button:", document.getElementById("sendOtpBtn"));
//   console.log("Button disabled status:", document.getElementById("sendOtpBtn").disabled);
//   debug("DOM fully loaded");
  
//   try {
//     const firebaseConfig = {
//       apiKey: 'AIzaSyB3ztQgxG11ImpOLG71Qaamxo3BAZu8LDY',
// authDomain: 'homiees-83616.firebaseapp.com',
// projectId: 'homiees-83616',
// storageBucket: 'homiees-83616.appspot.com',
// messagingSenderId: '510781279337',
// appId: '1:510781279337:web:90584f34627146368266f8',
//     recaptchaSiteKey: '6LeGiRgrAAAAAN8swLVeKjtSnf9d2txiAPAGOUsg'
//     };

//     debug("Initializing Firebase...");
//     firebase.initializeApp(firebaseConfig);
//     window.auth = firebase.auth();
//     debug("Firebase initialized");

//     debug("Initializing reCAPTCHA...");
//     window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
//       size: 'invisible',
//       callback: (response) => {
//         debug("reCAPTCHA verified: " + response);
//         document.getElementById("sendOtpBtn").disabled = false;
//       },
//       'expired-callback': () => {
//         debug("reCAPTCHA expired");
//         grecaptcha.reset(window.recaptchaWidgetId);
//       }
//     });

//     debug("Rendering reCAPTCHA...");
//     const widgetId = await window.recaptchaVerifier.render();
//     window.recaptchaWidgetId = widgetId;
//     debug("reCAPTCHA rendered with widget ID: " + widgetId);

//     // Enable send OTP button
//     document.getElementById("sendOtpBtn").disabled = false;
//     debug("Send OTP button enabled");
    
//   } catch (error) {
//     console.error("Initialization error:", error);
//     showFlash("Initialization failed: " + error.message, "error");
//   }
// });

// // Send OTP handler
// document.getElementById("sendOtpBtn").addEventListener("click", async function() {
//   const button = this;
//   debug("Send OTP button clicked");
  
//   button.disabled = true;
//   button.textContent = "Sending...";

//   try {
//     const phoneNumber = "+91" + document.getElementById("phoneNumber").value.trim();
//     debug("Phone number entered: " + phoneNumber);
    
//     if (!/^\+91\d{10}$/.test(phoneNumber)) {
//       throw new Error("Please enter a valid 10-digit phone number");
//     }

//     showFlash("Sending OTP...", "success");
//     debug("Verifying reCAPTCHA...");
    
//     await window.recaptchaVerifier.verify();
//     debug("reCAPTCHA verified, sending OTP...");
    
//     const confirmation = await auth.signInWithPhoneNumber(phoneNumber, window.recaptchaVerifier);
//     window.confirmationResult = confirmation;
//     debug("OTP sent successfully");
    
//     showFlash("OTP sent successfully!", "success");
//     document.getElementById("otpGroup").style.display = "block";
    
//   } catch (error) {
//     console.error("OTP Error:", error);
//     showFlash("OTP Error: " + error.message, "error");
//     debug("OTP Error: " + error.message);
    
//     if (window.recaptchaWidgetId) {
//       grecaptcha.reset(window.recaptchaWidgetId);
//       debug("reCAPTCHA reset");
//     }
//   } finally {
//     button.textContent = "Send OTP";
//     button.disabled = false;
//     debug("Send OTP button reset");
//   }
// });

// // Verify OTP handler
// document.getElementById("verifyOtpBtn").addEventListener("click", async function() {
//   const button = this;
//   button.disabled = true;
//   button.textContent = "Verifying...";

//   try {
//     const otp = document.getElementById("otp").value.trim();
//     debug("Verifying OTP: " + otp);

//     if (!/^\d{6}$/.test(otp)) {
//       throw new Error("Please enter a valid 6-digit OTP");
//     }

//     const result = await window.confirmationResult.confirm(otp);
//     document.getElementById("phoneVerified").value = "true";
//     debug("OTP verified successfully");
    
//     showFlash("Phone number verified successfully!", "success");
//     document.getElementById("otpGroup").style.display = "none";

//   } catch (error) {
//     console.error("OTP Verification Error:", error);
//     showFlash("OTP Error: " + error.message, "error");
//     debug("OTP Verification Error: " + error.message);
//   } finally {
//     button.textContent = "Verify OTP";
//     button.disabled = false;
//     debug("Verify OTP button reset");
//   }
// });

// Form submission handler
document.getElementById("providerForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  
  // if (document.getElementById("phoneVerified").value !== "true") {
  //   showFlash("Please verify your phone number first", "error");
  //   return;
  // }

  const button = document.getElementById("registerBtn");
  button.disabled = true;
  button.textContent = "Registering...";

  try {
    const token = await auth.currentUser?.getIdToken();
    const formData = new FormData(this);
    
    if (token) {
      formData.append("firebaseToken", token);
      debug("Added Firebase token to form data");
    }

    debug("Submitting form...");
    const response = await fetch(this.action, {
      method: "POST",
      body: formData
    });

    const result = await response.json();
    debug("Response received: " + JSON.stringify(result));

    if (!response.ok) {
      throw new Error(result.message || 'Registration failed');
    }

    if (result.success) {
      showFlash("Registration successful! Redirecting...", "success");
      setTimeout(() => {
        window.location.href = result.redirectUrl || "/";
      }, 2000);
    }
  } catch (error) {
    console.error("Registration Error:", error);
    showFlash("Registration Error: " + error.message, "error");
    debug("Registration Error: " + error.message);
  } finally {
    button.textContent = "Register as Provider";
    button.disabled = false;
    debug("Register button reset");
  }
});
