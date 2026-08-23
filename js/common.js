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