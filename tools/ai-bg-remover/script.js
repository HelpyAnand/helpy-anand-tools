/* =========================================================
   HELPY ANAND TOOLS
   AI BACKGROUND REMOVER
========================================================= */


/* =========================================================
   LOAD NAVBAR & FOOTER
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const componentsPath = "../../components/";

    /* -------------------------
       LOAD NAVBAR
    ------------------------- */

    fetch(componentsPath + "navbar.html")
        .then(function (response) {

            if (!response.ok) {
                throw new Error("Navbar load failed");
            }

            return response.text();
        })
        .then(function (data) {

            const navbarContainer =
                document.getElementById("navbar-container");

            if (navbarContainer) {
                navbarContainer.innerHTML = data;
            }
        })
        .catch(function (error) {

            console.error(
                "Error loading navbar:",
                error
            );
        });


    /* -------------------------
       LOAD FOOTER
    ------------------------- */

    fetch(componentsPath + "footer.html")
        .then(function (response) {

            if (!response.ok) {
                throw new Error("Footer load failed");
            }

            return response.text();
        })
        .then(function (data) {

            const footerContainer =
                document.getElementById("footer-container");

            if (footerContainer) {
                footerContainer.innerHTML = data;
            }
        })
        .catch(function (error) {

            console.error(
                "Error loading footer:",
                error
            );
        });

});


/* =========================================================
   ELEMENTS
========================================================= */

const imageInput =
    document.getElementById("imageInput");

const uploadArea =
    document.getElementById("uploadArea");

const statusText =
    document.getElementById("statusText");

const previewContainer =
    document.getElementById("previewContainer");

const originalImg =
    document.getElementById("originalImg");

const processedImg =
    document.getElementById("processedImg");

const actionButtons =
    document.getElementById("actionButtons");

const downloadBtn =
    document.getElementById("downloadBtn");

const resetBtn =
    document.getElementById("resetBtn");


/* =========================================================
   VARIABLES
========================================================= */

let originalBlobUrl = null;

let processedBlobUrl = null;

let isProcessing = false;


/* =========================================================
   VALID IMAGE TYPES
========================================================= */

const validImageTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
];


/* =========================================================
   FILE INPUT
========================================================= */

if (imageInput) {

    imageInput.addEventListener(
        "click",
        function () {

            /*
             * Allows selecting the same image again
             * after reset.
             */

            this.value = "";
        }
    );


    imageInput.addEventListener(
        "change",
        function (event) {

            const file =
                event.target.files &&
                event.target.files[0];

            if (!file) {
                return;
            }

            handleSelectedFile(file);
        }
    );
}


/* =========================================================
   SELECTED FILE HANDLER
========================================================= */

function handleSelectedFile(file) {

    if (!validImageTypes.includes(file.type)) {

        showError(
            "Please select a valid JPG, PNG, or WebP image."
        );

        return;
    }


    /*
     * Prevent processing another image
     * while current image is being processed.
     */

    if (isProcessing) {

        showError(
            "Please wait until the current image is processed."
        );

        return;
    }


    processImage(file);
}


/* =========================================================
   DRAG & DROP
========================================================= */

if (uploadArea) {


    /* -------------------------
       DRAG OVER
    ------------------------- */

    uploadArea.addEventListener(
        "dragover",
        function (event) {

            event.preventDefault();

            event.stopPropagation();

            uploadArea.classList.add("dragover");
        }
    );


    /* -------------------------
       DRAG ENTER
    ------------------------- */

    uploadArea.addEventListener(
        "dragenter",
        function (event) {

            event.preventDefault();

            event.stopPropagation();

            uploadArea.classList.add("dragover");
        }
    );


    /* -------------------------
       DRAG LEAVE
    ------------------------- */

    uploadArea.addEventListener(
        "dragleave",
        function (event) {

            event.preventDefault();

            event.stopPropagation();

            uploadArea.classList.remove("dragover");
        }
    );


    /* -------------------------
       DROP
    ------------------------- */

    uploadArea.addEventListener(
        "drop",
        function (event) {

            event.preventDefault();

            event.stopPropagation();

            uploadArea.classList.remove("dragover");


            const files =
                event.dataTransfer.files;


            if (!files || files.length === 0) {
                return;
            }


            const file = files[0];


            handleSelectedFile(file);
        }
    );
}


/* =========================================================
   PROCESS IMAGE
========================================================= */

async function processImage(file) {

    if (isProcessing) {
        return;
    }


    isProcessing = true;


    try {

        /* -------------------------
           CLEAN OLD URLs
        ------------------------- */

        revokeUrls();


        /* -------------------------
           ORIGINAL IMAGE PREVIEW
        ------------------------- */

        originalBlobUrl =
            URL.createObjectURL(file);

        originalImg.src =
            originalBlobUrl;


        processedImg.removeAttribute("src");


        /* -------------------------
           SHOW PREVIEW
        ------------------------- */

        previewContainer.classList.add("show");

        actionButtons.classList.remove("show");


        /* -------------------------
           STATUS
        ------------------------- */

        showStatus(
            "⏳ Loading AI model library..."
        );


        /* =================================================
           LOAD IMG.LY BACKGROUND REMOVAL
        ================================================= */

        const module = await import(
            "https://esm.sh/@imgly/background-removal@1.4.5"
        );


        const removeBackground =
            module.default;


        if (typeof removeBackground !== "function") {

            throw new Error(
                "Background removal library failed to load."
            );
        }


        /* -------------------------
           AI CONFIGURATION
        ------------------------- */

        const config = {

            publicPath:
                "https://unpkg.com/@imgly/background-removal-data@1.4.5/dist/",

            model: "medium",

            output: {
                format: "image/png",
                quality: 1
            },

            progress: function (
                key,
                current,
                total
            ) {

                if (total > 0) {

                    const percent =
                        Math.round(
                            (current / total) * 100
                        );

                    showStatus(
                        "⏳ Removing Background: " +
                        percent +
                        "%"
                    );
                }
            }
        };


        /* -------------------------
           START AI PROCESSING
        ------------------------- */

        showStatus(
            "⏳ Processing image... Please wait."
        );


        const resultBlob =
            await removeBackground(
                file,
                config
            );


        /* -------------------------
           RESULT CHECK
        ------------------------- */

        if (!resultBlob) {

            throw new Error(
                "No processed image was returned."
            );
        }


        /* -------------------------
           RESULT PREVIEW
        ------------------------- */

        processedBlobUrl =
            URL.createObjectURL(resultBlob);

        processedImg.src =
            processedBlobUrl;


        /* -------------------------
           SUCCESS
        ------------------------- */

        showSuccess(
            "✅ Background removed successfully!"
        );


        actionButtons.classList.add("show");


    } catch (error) {

        console.error(
            "Background Removal Error:",
            error
        );


        actionButtons.classList.remove(
            "show"
        );


        showError(
            "❌ Failed to remove background. Please try another image."
        );


    } finally {

        isProcessing = false;
    }
}


/* =========================================================
   DOWNLOAD IMAGE
========================================================= */

if (downloadBtn) {

    downloadBtn.addEventListener(
        "click",
        function () {

            if (!processedBlobUrl) {
                return;
            }


            const link =
                document.createElement("a");


            link.href =
                processedBlobUrl;


            link.download =
                "helpy-anand-bg-removed.png";


            document.body.appendChild(link);


            link.click();


            document.body.removeChild(link);
        }
    );
}


/* =========================================================
   RESET TOOL
========================================================= */

if (resetBtn) {

    resetBtn.addEventListener(
        "click",
        function () {

            if (isProcessing) {

                showError(
                    "Please wait until processing is complete."
                );

                return;
            }


            if (imageInput) {
                imageInput.value = "";
            }


            revokeUrls();

            resetUI();
        }
    );
}


/* =========================================================
   RESET UI
========================================================= */

function resetUI() {

    if (statusText) {

        statusText.textContent = "";

        statusText.className =
            "status-message";
    }


    if (previewContainer) {

        previewContainer.classList.remove(
            "show"
        );
    }


    if (actionButtons) {

        actionButtons.classList.remove(
            "show"
        );
    }


    if (originalImg) {

        originalImg.removeAttribute(
            "src"
        );
    }


    if (processedImg) {

        processedImg.removeAttribute(
            "src"
        );
    }


    if (uploadArea) {

        uploadArea.classList.remove(
            "dragover"
        );
    }
}


/* =========================================================
   SHOW STATUS
========================================================= */

function showStatus(message) {

    if (!statusText) {
        return;
    }


    statusText.textContent =
        message;


    statusText.className =
        "status-message";
}


/* =========================================================
   SHOW SUCCESS
========================================================= */

function showSuccess(message) {

    if (!statusText) {
        return;
    }


    statusText.textContent =
        message;


    statusText.className =
        "status-message success";
}


/* =========================================================
   SHOW ERROR
========================================================= */

function showError(message) {

    if (!statusText) {
        return;
    }


    statusText.textContent =
        message;


    statusText.className =
        "status-message error";
}


/* =========================================================
   REVOKE OBJECT URLS
========================================================= */

function revokeUrls() {

    if (originalBlobUrl) {

        URL.revokeObjectURL(
            originalBlobUrl
        );

        originalBlobUrl = null;
    }


    if (processedBlobUrl) {

        URL.revokeObjectURL(
            processedBlobUrl
        );

        processedBlobUrl = null;
    }
}