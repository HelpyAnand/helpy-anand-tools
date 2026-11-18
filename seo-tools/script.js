
document.addEventListener("DOMContentLoaded", function () {

    // SEO Tools page initialization
    console.log("Helpy Anand SEO Tools page loaded successfully.");

    // Add smooth hover accessibility
    const cards = document.querySelectorAll(".seo-card");

    cards.forEach(function (card) {
        card.setAttribute("aria-label", card.querySelector("h3")?.textContent || "SEO Tool");
    });

});
