// ==========================================
// COMMON NAVBAR
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const navbarContainer =
        document.getElementById("common-navbar");

    if (!navbarContainer) return;

    fetch("/components/navbar.html")
        .then(response => {

            if (!response.ok) {
                throw new Error(
                    "Navbar could not be loaded."
                );
            }

            return response.text();

        })
        .then(data => {

            navbarContainer.innerHTML = data;

        })
        .catch(error => {

            console.error(
                "Navbar Error:",
                error
            );

        });

});


// ==========================================
// COMMON FOOTER
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const footerContainer =
        document.getElementById("common-footer");

    if (!footerContainer) return;

    fetch("/components/footer.html")
        .then(response => {

            if (!response.ok) {
                throw new Error(
                    "Footer could not be loaded."
                );
            }

            return response.text();

        })
        .then(data => {

            footerContainer.innerHTML = data;

        })
        .catch(error => {

            console.error(
                "Footer Error:",
                error
            );

        });

});





document.addEventListener("DOMContentLoaded", function () {
    const contactForm = document.getElementById("contactForm");

    if (contactForm) {
        const statusDiv = document.createElement("div");
        statusDiv.className = "form-status";
        contactForm.appendChild(statusDiv);

        contactForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const submitBtn = contactForm.querySelector("button[type='submit']");
            const originalBtnText = submitBtn.innerText;

            submitBtn.innerText = "Sending...";
            submitBtn.disabled = true;

            const formData = new FormData(contactForm);

            fetch("https://api.web3forms.com/submit", {
                method: "POST",
                body: formData
            })
            .then(async (response) => {
                let json = await response.json();
                if (response.status == 200) {
                    showStatus("Thank you! Your message has been sent successfully.", "success");
                    contactForm.reset();
                } else {
                    showStatus(json.message || "Something went wrong!", "error");
                }
            })
            .catch((error) => {
                showStatus("Something went wrong! Please try again.", "error");
            })
            .finally(() => {
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            });

            function showStatus(text, type) {
                statusDiv.innerText = text;
                statusDiv.className = `form-status ${type}`;
                statusDiv.style.display = "block";
                
                setTimeout(() => {
                    statusDiv.style.display = "none";
                }, 5000);
            }
        });
    }
});