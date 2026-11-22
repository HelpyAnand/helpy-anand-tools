
"use strict";

/* ==========================================
   HELPY ANAND - ADVANCED SCHEMA GENERATOR
   Client-side JSON-LD Builder & Validator
========================================== */

(() => {
    const $ = (id) => document.getElementById(id);

    const schemaType = $("schemaType");
    const formFields = $("schemaFormFields");
    const jsonOutput = $("jsonOutput");
    const schemaItems = $("schemaItems");
    const schemaCount = $("schemaCount");
    const schemaMessage = $("schemaMessage");
    const validationSummary = $("validationSummary");
    const validationResults = $("validationResults");

    if (!schemaType || !formFields || !jsonOutput) {
        console.error("Schema Generator: Required HTML elements are missing.");
        return;
    }

    let schemas = [];
    let editingId = null;

    const field = (key, label, type = "text", options = {}) => ({
        key,
        label,
        type,
        ...options
    });

    /* ==========================================
       SCHEMA FIELD DEFINITIONS
    ========================================== */

    const schemaFields = {
        Organization: [
            field("name", "Organization Name", "text", { required: true }),
            field("url", "Website URL", "url", { required: true }),
            field("logo", "Logo URL", "url"),
            field("description", "Description", "textarea", { full: true }),
            field("email", "Email", "email"),
            field("telephone", "Telephone"),
            field("sameAs", "Social Profile URLs", "lines", { full: true, help: "One URL per line" })
        ],

        LocalBusiness: [
            field("name", "Business Name", "text", { required: true }),
            field("url", "Website URL", "url"),
            field("image", "Business Image URL", "url"),
            field("telephone", "Telephone"),
            field("priceRange", "Price Range", "text", { help: "Example: ₹₹ or $10-$50" }),
            field("description", "Description", "textarea", { full: true }),
            field("streetAddress", "Street Address", "text", { full: true }),
            field("addressLocality", "City"),
            field("addressRegion", "State / Region"),
            field("postalCode", "Postal Code"),
            field("addressCountry", "Country"),
            field("latitude", "Latitude"),
            field("longitude", "Longitude"),
            field("openingHours", "Opening Hours", "lines", { full: true, help: "Example: Mo-Fr 09:00-18:00" }),
            field("sameAs", "Social Profile URLs", "lines", { full: true })
        ],

        Person: [
            field("name", "Full Name", "text", { required: true }),
            field("url", "Website URL", "url"),
            field("image", "Profile Image URL", "url"),
            field("jobTitle", "Job Title"),
            field("description", "Description", "textarea", { full: true }),
            field("email", "Email", "email"),
            field("telephone", "Telephone"),
            field("sameAs", "Social Profile URLs", "lines", { full: true }),
            field("knowsAbout", "Areas of Expertise", "lines", { full: true })
        ],

        WebSite: [
            field("name", "Website Name", "text", { required: true }),
            field("url", "Website URL", "url", { required: true }),
            field("description", "Description", "textarea", { full: true }),
            field("inLanguage", "Language", "text", { help: "Example: en-IN or hi-IN" }),
            field("searchUrl", "Search URL Template", "url", { help: "Example: https://example.com/search?q={search_term_string}" })
        ],

        WebPage: [
            field("name", "Page Title", "text", { required: true }),
            field("url", "Page URL", "url", { required: true }),
            field("description", "Description", "textarea", { full: true }),
            field("image", "Page Image URL", "url"),
            field("inLanguage", "Language"),
            field("datePublished", "Date Published", "datetime"),
            field("dateModified", "Date Modified", "datetime")
        ],

        SoftwareApplication: [
            field("name", "Application Name", "text", { required: true }),
            field("url", "Application URL", "url", { required: true }),
            field("description", "Description", "textarea", { full: true }),
            field("applicationCategory", "Application Category", "select", {
                options: ["BusinessApplication", "DeveloperApplication", "EducationalApplication", "EntertainmentApplication", "FinanceApplication", "GameApplication", "HealthApplication", "LifestyleApplication", "MultimediaApplication", "ProductivityApplication", "SecurityApplication", "UtilitiesApplication"]
            }),
            field("operatingSystem", "Operating System"),
            field("price", "Price", "number"),
            field("priceCurrency", "Currency", "text", { help: "Example: INR or USD" }),
            field("image", "Application Image URL", "url")
        ],

        Article: [
            field("headline", "Article Headline", "text", { required: true }),
            field("url", "Article URL", "url", { required: true }),
            field("image", "Article Image URL", "url", { required: true }),
            field("description", "Article Description", "textarea", { full: true }),
            field("authorName", "Author Name", "text", { required: true }),
            field("authorUrl", "Author URL", "url"),
            field("publisherName", "Publisher Name"),
            field("publisherLogo", "Publisher Logo URL", "url"),
            field("datePublished", "Date Published", "datetime", { required: true }),
            field("dateModified", "Date Modified", "datetime"),
            field("inLanguage", "Language")
        ],

        BlogPosting: [
            field("headline", "Post Headline", "text", { required: true }),
            field("url", "Post URL", "url", { required: true }),
            field("image", "Featured Image URL", "url", { required: true }),
            field("description", "Post Description", "textarea", { full: true }),
            field("authorName", "Author Name", "text", { required: true }),
            field("authorUrl", "Author URL", "url"),
            field("publisherName", "Publisher Name"),
            field("publisherLogo", "Publisher Logo URL", "url"),
            field("datePublished", "Date Published", "datetime", { required: true }),
            field("dateModified", "Date Modified", "datetime"),
            field("inLanguage", "Language")
        ],

        NewsArticle: [
            field("headline", "News Headline", "text", { required: true }),
            field("url", "News Article URL", "url", { required: true }),
            field("image", "News Image URL", "url", { required: true }),
            field("description", "News Description", "textarea", { full: true }),
            field("authorName", "Author Name", "text", { required: true }),
            field("authorUrl", "Author URL", "url"),
            field("publisherName", "Publisher Name"),
            field("publisherLogo", "Publisher Logo URL", "url"),
            field("datePublished", "Date Published", "datetime", { required: true }),
            field("dateModified", "Date Modified", "datetime"),
            field("inLanguage", "Language")
        ],

        BreadcrumbList: [
            field("breadcrumbs", "Breadcrumb Items", "lines", {
                required: true,
                full: true,
                help: "One item per line: Label | Full URL. Add items in navigation order."
            })
        ],

        FAQPage: [
            field("faqs", "FAQ Questions and Answers", "lines", {
                required: true,
                full: true,
                help: "One FAQ per line: Question | Answer. Use genuine visible page content."
            })
        ],

        HowTo: [
            field("name", "How-To Title", "text", { required: true }),
            field("description", "Description", "textarea", { full: true }),
            field("image", "How-To Image URL", "url"),
            field("totalTime", "Total Time", "text", { help: "ISO 8601 duration, e.g. PT30M" }),
            field("steps", "Instructions", "lines", {
                required: true,
                full: true,
                help: "One step per line. Write steps in the correct order."
            })
        ],

        Product: [
            field("name", "Product Name", "text", { required: true }),
            field("description", "Product Description", "textarea", { full: true }),
            field("image", "Product Image URL", "url", { required: true }),
            field("sku", "SKU"),
            field("brand", "Brand Name"),
            field("price", "Price", "number"),
            field("priceCurrency", "Currency", "text", { help: "Example: INR or USD" }),
            field("availability", "Availability", "select", {
                options: ["InStock", "OutOfStock", "PreOrder", "BackOrder", "Discontinued", "LimitedAvailability"]
            }),
            field("condition", "Item Condition", "select", {
                options: ["NewCondition", "UsedCondition", "RefurbishedCondition", "DamagedCondition"]
            }),
            field("productUrl", "Product Page URL", "url"),
            field("ratingValue", "Rating Value", "number"),
            field("reviewCount", "Review Count", "number")
        ],

        Service: [
            field("name", "Service Name", "text", { required: true }),
            field("description", "Service Description", "textarea", { full: true }),
            field("url", "Service URL", "url"),
            field("image", "Service Image URL", "url"),
            field("providerName", "Provider Name"),
            field("providerUrl", "Provider URL", "url"),
            field("areaServed", "Area Served"),
            field("price", "Price", "number"),
            field("priceCurrency", "Currency")
        ],

        Offer: [
            field("name", "Offer Name", "text", { required: true }),
            field("url", "Offer URL", "url"),
            field("price", "Price", "number", { required: true }),
            field("priceCurrency", "Currency", "text", { required: true }),
            field("availability", "Availability", "select", {
                options: ["InStock", "OutOfStock", "PreOrder", "BackOrder", "LimitedAvailability"]
            }),
            field("validFrom", "Valid From", "date"),
            field("validThrough", "Valid Through", "date"),
            field("seller", "Seller Name")
        ],

        Review: [
            field("itemName", "Reviewed Item Name", "text", { required: true }),
            field("itemType", "Reviewed Item Type", "text", { help: "Example: Product, Book, LocalBusiness" }),
            field("authorName", "Reviewer Name", "text", { required: true }),
            field("reviewBody", "Review Text", "textarea", { full: true, required: true }),
            field("ratingValue", "Rating Value", "number", { required: true }),
            field("bestRating", "Best Rating", "number"),
            field("worstRating", "Worst Rating", "number"),
            field("datePublished", "Review Date", "date")
        ],

        Event: [
            field("name", "Event Name", "text", { required: true }),
            field("description", "Event Description", "textarea", { full: true }),
            field("url", "Event URL", "url"),
            field("image", "Event Image URL", "url"),
            field("startDate", "Start Date & Time", "datetime", { required: true }),
            field("endDate", "End Date & Time", "datetime"),
            field("locationName", "Venue Name", "text", { required: true }),
            field("streetAddress", "Street Address"),
            field("addressLocality", "City"),
            field("addressRegion", "State / Region"),
            field("postalCode", "Postal Code"),
            field("addressCountry", "Country"),
            field("organizerName", "Organizer Name"),
            field("organizerUrl", "Organizer URL", "url"),
            field("price", "Ticket Price", "number"),
            field("priceCurrency", "Currency"),
            field("availability", "Ticket Availability", "select", {
                options: ["InStock", "SoldOut", "PreOrder", "LimitedAvailability"]
            })
        ],

        JobPosting: [
            field("title", "Job Title", "text", { required: true }),
            field("description", "Job Description", "textarea", { full: true, required: true }),
            field("datePosted", "Date Posted", "date", { required: true }),
            field("validThrough", "Application Deadline", "datetime"),
            field("hiringOrganization", "Hiring Organization", "text", { required: true }),
            field("organizationUrl", "Organization Website", "url"),
            field("employmentType", "Employment Type", "select", {
                options: ["FULL_TIME", "PART_TIME", "CONTRACTOR", "TEMPORARY", "INTERN", "VOLUNTEER", "PER_DIEM", "OTHER"]
            }),
            field("jobLocationType", "Work Location Type", "select", {
                options: ["OnSite", "Remote", "Hybrid"]
            }),
            field("streetAddress", "Street Address"),
            field("addressLocality", "City"),
            field("addressRegion", "State / Region"),
            field("postalCode", "Postal Code"),
            field("addressCountry", "Country"),
            field("salary", "Salary", "number"),
            field("salaryCurrency", "Salary Currency"),
            field("salaryUnit", "Salary Unit", "select", {
                options: ["HOUR", "DAY", "WEEK", "MONTH", "YEAR"]
            })
        ],

        Course: [
            field("name", "Course Name", "text", { required: true }),
            field("description", "Course Description", "textarea", { full: true }),
            field("url", "Course URL", "url"),
            field("providerName", "Provider Name", "text", { required: true }),
            field("providerUrl", "Provider Website", "url"),
            field("image", "Course Image URL", "url"),
            field("courseCode", "Course Code")
        ],

        Recipe: [
            field("name", "Recipe Name", "text", { required: true }),
            field("description", "Recipe Description", "textarea", { full: true }),
            field("image", "Recipe Image URL", "url", { required: true }),
            field("authorName", "Author Name"),
            field("prepTime", "Preparation Time", "text", { help: "ISO 8601, e.g. PT15M" }),
            field("cookTime", "Cooking Time", "text"),
            field("totalTime", "Total Time", "text"),
            field("recipeYield", "Recipe Yield"),
            field("recipeCategory", "Recipe Category"),
            field("recipeCuisine", "Cuisine"),
            field("recipeIngredient", "Ingredients", "lines", { full: true, help: "One ingredient per line" }),
            field("recipeInstructions", "Instructions", "lines", { full: true, help: "One instruction per line" })
        ],

        VideoObject: [
            field("name", "Video Title", "text", { required: true }),
            field("description", "Video Description", "textarea", { full: true, required: true }),
            field("thumbnailUrl", "Thumbnail URL", "url", { required: true }),
            field("uploadDate", "Upload Date", "datetime", { required: true }),
            field("contentUrl", "Video File URL", "url"),
            field("embedUrl", "Embed URL", "url"),
            field("duration", "Duration", "text", { help: "ISO 8601, e.g. PT2M30S" })
        ],

        ImageObject: [
            field("name", "Image Name", "text", { required: true }),
            field("contentUrl", "Image URL", "url", { required: true }),
            field("caption", "Caption", "textarea", { full: true }),
            field("description", "Description", "textarea", { full: true }),
            field("creator", "Creator Name"),
            field("creditText", "Credit Text"),
            field("license", "License URL", "url")
        ],

        Book: [
            field("name", "Book Title", "text", { required: true }),
            field("authorName", "Author Name", "text", { required: true }),
            field("isbn", "ISBN"),
            field("bookFormat", "Book Format", "select", {
                options: ["Hardcover", "Paperback", "EBook", "AudiobookFormat"]
            }),
            field("url", "Book URL", "url"),
            field("image", "Cover Image URL", "url"),
            field("description", "Description", "textarea", { full: true }),
            field("datePublished", "Publication Date", "date")
        ],

        ContactPage: [
            field("name", "Page Title", "text", { required: true }),
            field("url", "Page URL", "url", { required: true }),
            field("description", "Description", "textarea", { full: true }),
            field("inLanguage", "Language")
        ],

        CollectionPage: [
            field("name", "Collection Title", "text", { required: true }),
            field("url", "Collection URL", "url", { required: true }),
            field("description", "Description", "textarea", { full: true }),
            field("image", "Image URL", "url"),
            field("inLanguage", "Language")
        ]
    };

    /* ==========================================
       HELPERS
    ========================================== */

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function showMessage(message, type = "success") {
        schemaMessage.textContent = message;
        schemaMessage.className = "schema-message " + type;
    }

    function clearValidation() {
        validationSummary.className = "validation-summary";
        validationSummary.textContent = "Schema updated. Run validation to see the latest results.";
        validationResults.replaceChildren();
    }

    function splitLines(value) {
        return String(value || "")
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);
    }

    function isValidUrl(value) {
        try {
            const url = new URL(value);
            return url.protocol === "http:" || url.protocol === "https:";
        } catch {
            return false;
        }
    }

    function makeElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    /* ==========================================
       DYNAMIC FORM RENDERING
    ========================================== */

    function renderForm(type, values = {}) {
        formFields.replaceChildren();

        const definitions = schemaFields[type] || [];

        definitions.forEach(def => {
            const wrapper = makeElement(
                "div",
                "schema-field" + (def.full ? " schema-field-full" : "")
            );

            const label = makeElement("label", "", def.label + (def.required ? " *" : ""));
            label.htmlFor = "schemaField_" + def.key;

            let input;

            if (def.type === "textarea" || def.type === "lines") {
                input = document.createElement("textarea");
                input.rows = def.type === "lines" ? 5 : 3;
                input.placeholder = def.type === "lines"
                    ? "Enter one item per line..."
                    : "Enter " + def.label.toLowerCase() + "...";
            } else if (def.type === "select") {
                input = document.createElement("select");

                const blank = document.createElement("option");
                blank.value = "";
                blank.textContent = "Select " + def.label;
                input.appendChild(blank);

                (def.options || []).forEach(option => {
                    const item = document.createElement("option");
                    item.value = option;
                    item.textContent = option;
                    input.appendChild(item);
                });
            } else {
                input = document.createElement("input");
                input.type = def.type === "datetime" ? "datetime-local" : def.type;
                if (!["url", "email", "number", "date", "datetime-local"].includes(input.type)) {
                    input.type = "text";
                }
            }

            input.id = "schemaField_" + def.key;
            input.dataset.schemaKey = def.key;
            input.value = values[def.key] || "";

            if (def.required) input.required = true;

            wrapper.appendChild(label);
            wrapper.appendChild(input);

            if (def.help) {
                wrapper.appendChild(makeElement("small", "", def.help));
            }

            formFields.appendChild(wrapper);
        });
    }

    function getFormValues() {
        const values = {};

        formFields.querySelectorAll("[data-schema-key]").forEach(input => {
            values[input.dataset.schemaKey] = input.value.trim();
        });

        return values;
    }

    /* ==========================================
       OBJECT BUILDERS
    ========================================== */

    function addAddress(target, values) {
        const address = {};

        const mapping = {
            streetAddress: "streetAddress",
            addressLocality: "addressLocality",
            addressRegion: "addressRegion",
            postalCode: "postalCode",
            addressCountry: "addressCountry"
        };

        Object.entries(mapping).forEach(([source, destination]) => {
            if (values[source]) address[destination] = values[source];
        });

        if (Object.keys(address).length) {
            target.address = {
                "@type": "PostalAddress",
                ...address
            };
        }
    }

    function addImage(target, value) {
        if (value) target.image = value;
    }

    function buildSchema(type, values) {
        const result = {
            "@context": "https://schema.org",
            "@type": type
        };

        const put = (key, value) => {
            if (value !== undefined && value !== null && value !== "") {
                result[key] = value;
            }
        };

        const putNumber = (key, value) => {
            if (value !== "") {
                const number = Number(value);
                if (Number.isFinite(number)) put(key, number);
            }
        };

        const putLines = (key, value) => {
            const items = splitLines(value);
            if (items.length) put(key, items);
        };

        switch (type) {
            case "Organization":
                put("name", values.name);
                put("url", values.url);
                put("description", values.description);
                put("logo", values.logo);
                put("email", values.email);
                put("telephone", values.telephone);
                putLines("sameAs", values.sameAs);
                break;

            case "LocalBusiness":
                put("name", values.name);
                put("url", values.url);
                put("description", values.description);
                put("telephone", values.telephone);
                put("priceRange", values.priceRange);
                addImage(result, values.image);
                addAddress(result, values);

                if (values.latitude !== "" && values.longitude !== "") {
                    const lat = Number(values.latitude);
                    const lng = Number(values.longitude);

                    if (Number.isFinite(lat) && Number.isFinite(lng)) {
                        result.geo = {
                            "@type": "GeoCoordinates",
                            latitude: lat,
                            longitude: lng
                        };
                    }
                }

                putLines("openingHours", values.openingHours);
                putLines("sameAs", values.sameAs);
                break;

            case "Person":
                put("name", values.name);
                put("url", values.url);
                put("description", values.description);
                put("image", values.image);
                put("jobTitle", values.jobTitle);
                put("email", values.email);
                put("telephone", values.telephone);
                putLines("sameAs", values.sameAs);
                putLines("knowsAbout", values.knowsAbout);
                break;

            case "WebSite":
                put("name", values.name);
                put("url", values.url);
                put("description", values.description);
                put("inLanguage", values.inLanguage);

                if (values.searchUrl) {
                    result.potentialAction = {
                        "@type": "SearchAction",
                        target: values.searchUrl,
                        "query-input": "required name=search_term_string"
                    };
                }
                break;

            case "WebPage":
            case "ContactPage":
            case "CollectionPage":
                put("name", values.name);
                put("url", values.url);
                put("description", values.description);
                put("image", values.image);
                put("inLanguage", values.inLanguage);
                put("datePublished", values.datePublished);
                put("dateModified", values.dateModified);
                break;

            case "Article":
            case "BlogPosting":
            case "NewsArticle":
                put("headline", values.headline);
                put("url", values.url);
                put("description", values.description);
                put("image", values.image);
                put("datePublished", values.datePublished);
                put("dateModified", values.dateModified);
                put("inLanguage", values.inLanguage);

                if (values.authorName) {
                    result.author = {
                        "@type": "Person",
                        name: values.authorName
                    };
                    if (values.authorUrl) result.author.url = values.authorUrl;
                }

                if (values.publisherName) {
                    result.publisher = {
                        "@type": "Organization",
                        name: values.publisherName
                    };
                    if (values.publisherLogo) {
                        result.publisher.logo = {
                            "@type": "ImageObject",
                            url: values.publisherLogo
                        };
                    }
                }
                break;

            case "BreadcrumbList": {
                const crumbs = splitLines(values.breadcrumbs);
                result.itemListElement = crumbs.map((line, index) => {
                    const parts = line.split("|").map(part => part.trim());
                    const item = {
                        "@type": "ListItem",
                        position: index + 1,
                        name: parts[0] || ""
                    };
                    if (parts[1]) item.item = parts[1];
                    return item;
                });
                break;
            }

            case "FAQPage": {
                const faqs = splitLines(values.faqs);
                result.mainEntity = faqs.map(line => {
                    const parts = line.split("|");
                    return {
                        "@type": "Question",
                        name: (parts.shift() || "").trim(),
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: parts.join("|").trim()
                        }
                    };
                });
                break;
            }

            case "HowTo":
                put("name", values.name);
                put("description", values.description);
                put("image", values.image);
                put("totalTime", values.totalTime);

                result.step = splitLines(values.steps).map((step, index) => ({
                    "@type": "HowToStep",
                    position: index + 1,
                    name: "Step " + (index + 1),
                    text: step
                }));
                break;

            case "Product":
                put("name", values.name);
                put("description", values.description);
                put("image", values.image);
                put("sku", values.sku);

                if (values.brand) {
                    result.brand = {
                        "@type": "Brand",
                        name: values.brand
                    };
                }

                if (values.price !== "" || values.availability || values.productUrl) {
                    result.offers = {
                        "@type": "Offer"
                    };

                    putNumberTo(result.offers, "price", values.price);
                    putTo(result.offers, "priceCurrency", values.priceCurrency);

                    if (values.availability) {
                        result.offers.availability =
                            "https://schema.org/" + values.availability;
                    }

                    putTo(result.offers, "url", values.productUrl);

                    if (values.condition) {
                        result.offers.itemCondition =
                            "https://schema.org/" + values.condition;
                    }
                }

                if (values.ratingValue !== "" || values.reviewCount !== "") {
                    result.aggregateRating = {
                        "@type": "AggregateRating"
                    };
                    putNumberTo(result.aggregateRating, "ratingValue", values.ratingValue);
                    putNumberTo(result.aggregateRating, "reviewCount", values.reviewCount);
                }
                break;

            case "Service":
                put("name", values.name);
                put("description", values.description);
                put("url", values.url);
                put("image", values.image);
                put("areaServed", values.areaServed);

                if (values.providerName) {
                    result.provider = {
                        "@type": "Organization",
                        name: values.providerName
                    };
                    putTo(result.provider, "url", values.providerUrl);
                }

                if (values.price !== "") {
                    result.offers = {
                        "@type": "Offer",
                        price: Number(values.price)
                    };
                    putTo(result.offers, "priceCurrency", values.priceCurrency);
                }
                break;

            case "Offer":
                put("name", values.name);
                put("url", values.url);
                putNumber("price", values.price);
                put("priceCurrency", values.priceCurrency);
                put("validFrom", values.validFrom);
                put("validThrough", values.validThrough);

                if (values.availability) {
                    put("availability", "https://schema.org/" + values.availability);
                }

                if (values.seller) {
                    result.seller = {
                        "@type": "Organization",
                        name: values.seller
                    };
                }
                break;

            case "Review":
                result.itemReviewed = {
                    "@type": values.itemType || "Thing",
                    name: values.itemName
                };

                put("reviewBody", values.reviewBody);
                put("datePublished", values.datePublished);

                if (values.authorName) {
                    result.author = {
                        "@type": "Person",
                        name: values.authorName
                    };
                }

                if (values.ratingValue !== "") {
                    result.reviewRating = {
                        "@type": "Rating",
                        ratingValue: Number(values.ratingValue)
                    };
                    putNumberTo(result.reviewRating, "bestRating", values.bestRating);
                    putNumberTo(result.reviewRating, "worstRating", values.worstRating);
                }
                break;

            case "Event":
                put("name", values.name);
                put("description", values.description);
                put("url", values.url);
                put("image", values.image);
                put("startDate", values.startDate);
                put("endDate", values.endDate);

                if (values.locationName) {
                    result.location = {
                        "@type": "Place",
                        name: values.locationName
                    };
                    addAddress(result.location, values);
                }

                if (values.organizerName) {
                    result.organizer = {
                        "@type": "Organization",
                        name: values.organizerName
                    };
                    putTo(result.organizer, "url", values.organizerUrl);
                }

                if (values.price !== "") {
                    result.offers = {
                        "@type": "Offer",
                        price: Number(values.price)
                    };
                    putTo(result.offers, "priceCurrency", values.priceCurrency);
                    if (values.availability) {
                        result.offers.availability =
                            "https://schema.org/" + values.availability;
                    }
                }
                break;

            case "JobPosting":
                put("title", values.title);
                put("description", values.description);
                put("datePosted", values.datePosted);
                put("validThrough", values.validThrough);
                put("employmentType", values.employmentType);

                if (values.hiringOrganization) {
                    result.hiringOrganization = {
                        "@type": "Organization",
                        name: values.hiringOrganization
                    };
                    putTo(result.hiringOrganization, "sameAs", values.organizationUrl);
                }

                if (values.streetAddress || values.addressLocality || values.addressCountry) {
                    result.jobLocation = {
                        "@type": "Place"
                    };
                    addAddress(result.jobLocation, values);
                }

                if (values.jobLocationType === "Remote") {
                    result.jobLocationType = "TELECOMMUTE";
                }

                if (values.salary !== "") {
                    result.baseSalary = {
                        "@type": "MonetaryAmount",
                        currency: values.salaryCurrency || "INR",
                        value: {
                            "@type": "QuantitativeValue",
                            value: Number(values.salary),
                            unitText: values.salaryUnit || "YEAR"
                        }
                    };
                }
                break;

            case "Course":
                put("name", values.name);
                put("description", values.description);
                put("url", values.url);
                put("image", values.image);
                put("courseCode", values.courseCode);

                if (values.providerName) {
                    result.provider = {
                        "@type": "Organization",
                        name: values.providerName
                    };
                    putTo(result.provider, "url", values.providerUrl);
                }
                break;

            case "Recipe":
                put("name", values.name);
                put("description", values.description);
                put("image", values.image);
                put("prepTime", values.prepTime);
                put("cookTime", values.cookTime);
                put("totalTime", values.totalTime);
                put("recipeYield", values.recipeYield);
                put("recipeCategory", values.recipeCategory);
                put("recipeCuisine", values.recipeCuisine);
                putLines("recipeIngredient", values.recipeIngredient);

                const instructions = splitLines(values.recipeInstructions);
                if (instructions.length) {
                    result.recipeInstructions = instructions.map((text, index) => ({
                        "@type": "HowToStep",
                        position: index + 1,
                        text
                    }));
                }

                if (values.authorName) {
                    result.author = {
                        "@type": "Person",
                        name: values.authorName
                    };
                }
                break;

            case "VideoObject":
                put("name", values.name);
                put("description", values.description);
                put("thumbnailUrl", values.thumbnailUrl);
                put("uploadDate", values.uploadDate);
                put("contentUrl", values.contentUrl);
                put("embedUrl", values.embedUrl);
                put("duration", values.duration);
                break;

            case "ImageObject":
                put("name", values.name);
                put("contentUrl", values.contentUrl);
                put("caption", values.caption);
                put("description", values.description);
                put("creator", values.creator);
                put("creditText", values.creditText);
                put("license", values.license);
                break;

            case "Book":
                put("name", values.name);
                put("isbn", values.isbn);
                put("bookFormat", values.bookFormat);
                put("url", values.url);
                put("image", values.image);
                put("description", values.description);
                put("datePublished", values.datePublished);

                if (values.authorName) {
                    result.author = {
                        "@type": "Person",
                        name: values.authorName
                    };
                }
                break;

            default:
                throw new Error("Unsupported schema type.");
        }

        return result;
    }

    function putTo(target, key, value) {
        if (value !== undefined && value !== null && value !== "") {
            target[key] = value;
        }
    }

    function putNumberTo(target, key, value) {
        if (value !== undefined && value !== null && value !== "") {
            const number = Number(value);
            if (Number.isFinite(number)) target[key] = number;
        }
    }

    /* ==========================================
       SCHEMA GRAPH MANAGEMENT
    ========================================== */

    function updateOutput() {
        if (!schemas.length) {
            jsonOutput.value = "";
            return;
        }

        const graph = schemas.map(item => item.data);

        const output = graph.length === 1
            ? graph[0]
            : {
                "@context": "https://schema.org",
                "@graph": graph.map(item => {
                    const copy = { ...item };
                    delete copy["@context"];
                    return copy;
                })
            };

        jsonOutput.value = JSON.stringify(output, null, 2);
        clearValidation();
    }

    function renderSchemaList() {
        schemaItems.replaceChildren();
        schemaCount.textContent = schemas.length + (schemas.length === 1 ? " item" : " items");

        if (!schemas.length) {
            schemaItems.appendChild(
                makeElement("p", "schema-empty", "Your added schema blocks will appear here.")
            );
            return;
        }

        schemas.forEach(item => {
            const row = makeElement("div", "schema-item");
            const info = makeElement("div");

            info.appendChild(makeElement("strong", "", item.type));
            info.appendChild(makeElement("small", "", item.title || "Schema block"));

            const actions = makeElement("div", "schema-item-actions");

            const editBtn = makeElement("button", "", "Edit");
            editBtn.type = "button";
            editBtn.addEventListener("click", () => editSchema(item.id));

            const removeBtn = makeElement("button", "", "Remove");
            removeBtn.type = "button";
            removeBtn.addEventListener("click", () => removeSchema(item.id));

            actions.append(editBtn, removeBtn);
            row.append(info, actions);
            schemaItems.appendChild(row);
        });
    }

    function addSchema() {
        const type = schemaType.value;
        const values = getFormValues();
        const definitions = schemaFields[type] || [];

        const missing = definitions
            .filter(def => def.required && !values[def.key])
            .map(def => def.label);

        if (missing.length) {
            showMessage("Please complete required fields: " + missing.join(", "), "error");
            return;
        }

        try {
            const data = buildSchema(type, values);

            if (type === "FAQPage") {
                const invalid = data.mainEntity.some(item =>
                    !item.name || !item.acceptedAnswer.text
                );
                if (invalid) {
                    showMessage("Each FAQ line must contain both Question and Answer separated by |.", "error");
                    return;
                }
            }

            if (type === "BreadcrumbList") {
                const invalid = data.itemListElement.some(item => !item.name || !item.item);
                if (invalid) {
                    showMessage("Each breadcrumb line must contain Label | Full URL.", "error");
                    return;
                }
            }

            if (editingId !== null) {
                const index = schemas.findIndex(item => item.id === editingId);

                if (index !== -1) {
                    schemas[index] = {
                        id: editingId,
                        type,
                        title: data.name || data.headline || data.title || data.url || type,
                        data
                    };
                }

                editingId = null;
                $("addSchemaBtn").textContent = "Add Schema to Graph";
                showMessage("Schema updated successfully.");
            } else {
                schemas.push({
                    id: Date.now() + Math.random().toString(16).slice(2),
                    type,
                    title: data.name || data.headline || data.title || data.url || type,
                    data
                });

                showMessage(type + " schema added to graph.");
            }

            renderSchemaList();
            updateOutput();

        } catch (error) {
            showMessage(error.message || "Could not build schema.", "error");
        }
    }

    function editSchema(id) {
        const item = schemas.find(entry => entry.id === id);
        if (!item) return;

        editingId = id;

        const values = {};

        Object.entries(item.data).forEach(([key, value]) => {
            if (typeof value === "string" || typeof value === "number") {
                values[key] = String(value);
            }
        });

        if (item.type === "FAQPage" && Array.isArray(item.data.mainEntity)) {
            values.faqs = item.data.mainEntity.map(item =>
                item.name + " | " + (item.acceptedAnswer?.text || "")
            ).join("\n");
        }

        if (item.type === "BreadcrumbList" && Array.isArray(item.data.itemListElement)) {
            values.breadcrumbs = item.data.itemListElement.map(item =>
                item.name + " | " + (typeof item.item === "string" ? item.item : "")
            ).join("\n");
        }

        if (item.type === "HowTo" && Array.isArray(item.data.step)) {
            values.steps = item.data.step.map(step => step.text || step.name || "").join("\n");
        }

        if (item.type === "Recipe") {
            values.recipeIngredient = Array.isArray(item.data.recipeIngredient)
                ? item.data.recipeIngredient.join("\n") : "";

            values.recipeInstructions = Array.isArray(item.data.recipeInstructions)
                ? item.data.recipeInstructions.map(step => step.text || "").join("\n") : "";
        }

        schemaType.value = item.type;
        renderForm(item.type, values);
        $("addSchemaBtn").textContent = "Update Schema";
        showMessage("Editing " + item.type + " schema.", "warning");

        formFields.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function removeSchema(id) {
        schemas = schemas.filter(item => item.id !== id);

        if (editingId === id) {
            editingId = null;
            $("addSchemaBtn").textContent = "Add Schema to Graph";
        }

        renderSchemaList();
        updateOutput();
        showMessage("Schema removed.");
    }

    function resetWorkspace() {
        schemas = [];
        editingId = null;
        schemaType.value = "Organization";
        renderForm("Organization");
        renderSchemaList();
        jsonOutput.value = "";
        $("addSchemaBtn").textContent = "Add Schema to Graph";
        showMessage("Workspace reset.");
        validationSummary.textContent = "Add or import schema markup, then run validation.";
        validationSummary.className = "validation-summary";
        validationResults.replaceChildren();
    }

    /* ==========================================
       JSON EDITOR AND EXPORT
    ========================================== */

    function parseEditor() {
        const text = jsonOutput.value.trim();

        if (!text) throw new Error("JSON-LD editor is empty.");

        let data;

        try {
            data = JSON.parse(text);
        } catch (error) {
            throw new Error("Invalid JSON syntax: " + error.message);
        }

        if (!data || typeof data !== "object" || Array.isArray(data)) {
            throw new Error("The JSON root must be an object.");
        }

        return data;
    }

    async function copyText(text) {
        if (!text) {
            showMessage("There is no content to copy.", "error");
            return;
        }

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const temp = document.createElement("textarea");
                temp.value = text;
                temp.style.position = "fixed";
                temp.style.opacity = "0";
                document.body.appendChild(temp);
                temp.select();

                const copied = document.execCommand("copy");
                temp.remove();

                if (!copied) throw new Error("Copy command failed.");
            }

            showMessage("Copied successfully.");
        } catch {
            showMessage("Copy failed. Please select and copy the code manually.", "error");
        }
    }

    function downloadFile(filename, content, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");

        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function formatJSON() {
        try {
            jsonOutput.value = JSON.stringify(parseEditor(), null, 2);
            showMessage("JSON formatted successfully.");
        } catch (error) {
            showMessage(error.message, "error");
        }
    }

    function minifyJSON() {
        try {
            jsonOutput.value = JSON.stringify(parseEditor());
            showMessage("JSON minified successfully.");
        } catch (error) {
            showMessage(error.message, "error");
        }
    }

    function copyHTML() {
        try {
            const data = parseEditor();
            const json = JSON.stringify(data, null, 2);
            const safeJson = json.replace(/</g, "\\u003c");
            const html = '<script type="application/ld+json">\n' +
                safeJson +
                '\n<\/script>';

            copyText(html);
        } catch (error) {
            showMessage(error.message, "error");
        }
    }

    /* ==========================================
       IMPORT JSON / JSON-LD FILE
    ========================================== */

    function importData(data) {
        if (!data || typeof data !== "object" || Array.isArray(data)) {
            throw new Error("Imported JSON must contain an object.");
        }

        const graph = Array.isArray(data["@graph"]) ? data["@graph"] : [data];

        if (!graph.length) {
            throw new Error("No schema objects found.");
        }

        const imported = graph.map((item, index) => {
            if (!item || typeof item !== "object" || Array.isArray(item)) {
                throw new Error("Invalid schema object at position " + (index + 1));
            }

            const type = Array.isArray(item["@type"])
                ? item["@type"].join(", ")
                : item["@type"] || "Unknown";

            return {
                id: Date.now() + Math.random().toString(16).slice(2) + index,
                type,
                title: item.name || item.headline || item.title || type,
                data: item
            };
        });

        schemas = imported;
        editingId = null;

        renderSchemaList();
        jsonOutput.value = JSON.stringify(data, null, 2);
        $("addSchemaBtn").textContent = "Add Schema to Graph";

        if (schemaFields[imported[0].type]) {
            schemaType.value = imported[0].type;
            renderForm(imported[0].type);
        }

        showMessage(imported.length + " schema block(s) imported successfully.");
        clearValidation();
    }

    async function handleImport() {
        const fileInput = $("importJsonFile");
        const file = fileInput.files && fileInput.files[0];

        if (!file) {
            showMessage("Please select a JSON or JSON-LD file first.", "error");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showMessage("File is too large. Maximum supported size is 2 MB.", "error");
            return;
        }

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            importData(data);
            fileInput.value = "";
        } catch (error) {
            showMessage("Import failed: " + error.message, "error");
        }
    }

    /* ==========================================
       SAMPLE SCHEMA
    ========================================== */

    function loadExample() {
        const example = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": "How to Improve Your Website SEO",
            "description": "A practical guide to improving website SEO with useful optimization techniques.",
            "image": "https://example.com/images/seo-guide.jpg",
            "url": "https://example.com/blog/seo-guide/",
            "datePublished": "2026-11-21",
            "dateModified": "2026-11-21",
            "author": {
                "@type": "Person",
                "name": "Example Author"
            },
            "publisher": {
                "@type": "Organization",
                "name": "Example Website"
            }
        };

        importData(example);
        showMessage("Sample BlogPosting schema loaded. Replace example details with your own.");
    }

    /* ==========================================
       VALIDATION ENGINE
    ========================================== */

    function validateSchema() {
        validationResults.replaceChildren();

        let data;

        try {
            data = parseEditor();
        } catch (error) {
            validationSummary.className = "validation-summary error";
            validationSummary.textContent = error.message;
            addValidationItem("error", "JSON syntax error", error.message);
            return;
        }

        const issues = [];
        const addIssue = (level, title, message) => {
            issues.push({ level, title, message });
        };

        function inspectObject(obj, path = "root") {
            if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
                addIssue("error", "Invalid schema object", path + " must be an object.");
                return;
            }

            const type = obj["@type"];

            if (!type) {
                addIssue("error", "Missing @type", path + " does not contain an @type property.");
            }

            if (!obj["@context"] && path === "root") {
                addIssue("warning", "Missing @context", "The root object should declare its Schema.org context.");
            }

            if (typeof type === "string") {
                const requiredFields = {
                    Organization: ["name"],
                    LocalBusiness: ["name", "address"],
                    Person: ["name"],
                    WebSite: ["name", "url"],
                    WebPage: ["name", "url"],
                    Article: ["headline", "image", "datePublished", "author"],
                    BlogPosting: ["headline", "image", "datePublished", "author"],
                    NewsArticle: ["headline", "image", "datePublished", "author"],
                    Product: ["name", "image"],
                    Service: ["name"],
                    Event: ["name", "startDate", "location"],
                    JobPosting: ["title", "description", "datePosted", "hiringOrganization"],
                    Recipe: ["name", "image", "recipeIngredient", "recipeInstructions"],
                    VideoObject: ["name", "description", "thumbnailUrl", "uploadDate"],
                    FAQPage: ["mainEntity"],
                    BreadcrumbList: ["itemListElement"],
                    Course: ["name", "provider"],
                    Review: ["itemReviewed", "reviewRating", "author"]
                };

                (requiredFields[type] || []).forEach(key => {
                    const value = obj[key];

                    if (value === undefined || value === null || value === "") {
                        addIssue("warning", "Recommended property missing", type + ": consider adding " + key + ".");
                    }
                });
            }

            ["url", "image", "logo", "contentUrl", "thumbnailUrl", "embedUrl"].forEach(key => {
                const value = obj[key];

                if (typeof value === "string" && value && !isValidUrl(value)) {
                    addIssue("error", "Invalid URL", path + "." + key + " should be a valid HTTP or HTTPS URL.");
                }
            });

            if (obj.offers && typeof obj.offers === "object") {
                if (obj.offers.price !== undefined &&
                    (!Number.isFinite(Number(obj.offers.price)) || Number(obj.offers.price) < 0)) {
                    addIssue("error", "Invalid offer price", "Offer price must be a non-negative number.");
                }
            }

            if (obj["@type"] === "FAQPage" && Array.isArray(obj.mainEntity)) {
                if (!obj.mainEntity.length) {
                    addIssue("warning", "Empty FAQ list", "Add at least one Question and Answer.");
                }

                obj.mainEntity.forEach((question, index) => {
                    if (!question.name || !question.acceptedAnswer || !question.acceptedAnswer.text) {
                        addIssue("error", "Incomplete FAQ", "FAQ item " + (index + 1) + " needs a question and answer.");
                    }
                });
            }

            if (obj["@type"] === "BreadcrumbList" && Array.isArray(obj.itemListElement)) {
                obj.itemListElement.forEach((item, index) => {
                    if (item.position !== index + 1) {
                        addIssue("warning", "Breadcrumb position", "Breadcrumb item " + (index + 1) + " should have position " + (index + 1) + ".");
                    }

                    if (item.item && typeof item.item === "string" && !isValidUrl(item.item)) {
                        addIssue("error", "Invalid breadcrumb URL", "Breadcrumb item " + (index + 1) + " has an invalid URL.");
                    }
                });
            }
        }

        if (Array.isArray(data["@graph"])) {
            if (!data["@graph"].length) {
                addIssue("warning", "Empty graph", "The @graph array contains no schema items.");
            }

            data["@graph"].forEach((item, index) => {
                inspectObject(item, "@graph[" + index + "]");
            });
        } else {
            inspectObject(data);
        }

        const jsonText = JSON.stringify(data);

        if (/"@type"\s*:\s*"FAQPage"/.test(jsonText)) {
            addIssue("warning", "FAQ rich result eligibility", "Valid FAQ markup does not guarantee Google FAQ rich results. Google currently limits FAQ rich results mainly to well-known authoritative government and health websites.");
        }

        if (/"@type"\s*:\s*"Product"/.test(jsonText) &&
            !/"offers"\s*:/.test(jsonText) &&
            !/"aggregateRating"\s*:/.test(jsonText) &&
            !/"review"\s*:/.test(jsonText)) {
            addIssue("warning", "Product enhancement fields", "Consider adding accurate offer, review or aggregate rating data where applicable.");
        }

        if (!issues.length) {
            addIssue("success", "Basic checks passed", "No common JSON or property issues were detected. This is not a complete Schema.org or Google rich result validation.");
        }

        const errors = issues.filter(item => item.level === "error").length;
        const warnings = issues.filter(item => item.level === "warning").length;
        const successes = issues.filter(item => item.level === "success").length;

        if (errors) {
            validationSummary.className = "validation-summary error";
            validationSummary.textContent = errors + " error(s), " + warnings + " warning(s). Review the findings below.";
        } else if (warnings) {
            validationSummary.className = "validation-summary warning";
            validationSummary.textContent = warnings + " recommendation(s) found. Review the findings below.";
        } else {
            validationSummary.className = "validation-summary success";
            validationSummary.textContent = successes + " basic check(s) passed. No common issues detected.";
        }

        issues.forEach(item => {
            addValidationItem(item.level, item.title, item.message);
        });
    }

    function addValidationItem(level, title, message) {
        const row = makeElement("div", "validation-item " + level);
        const icon = makeElement(
            "span",
            "validation-icon",
            level === "error" ? "✕" : level === "warning" ? "!" : "✓"
        );

        const content = makeElement("div");
        content.appendChild(makeElement("strong", "", title));
        content.appendChild(makeElement("p", "", message));

        row.append(icon, content);
        validationResults.appendChild(row);
    }

    /* ==========================================
       EVENT LISTENERS
    ========================================== */

    schemaType.addEventListener("change", () => {
        editingId = null;
        $("addSchemaBtn").textContent = "Add Schema to Graph";
        renderForm(schemaType.value);
        showMessage("Fill in the fields for " + schemaType.value + ".");
    });

    $("addSchemaBtn").addEventListener("click", addSchema);
    $("resetAllBtn").addEventListener("click", resetWorkspace);

    $("formatJsonBtn").addEventListener("click", formatJSON);
    $("minifyJsonBtn").addEventListener("click", minifyJSON);

    $("copyJsonBtn").addEventListener("click", () => {
        copyText(jsonOutput.value);
    });

    $("downloadJsonBtn").addEventListener("click", () => {
        try {
            const data = parseEditor();
            downloadFile(
                "schema-markup.json",
                JSON.stringify(data, null, 2),
                "application/ld+json;charset=utf-8"
            );
            showMessage("JSON-LD file downloaded.");
        } catch (error) {
            showMessage(error.message, "error");
        }
    });

    $("copyHtmlBtn").addEventListener("click", copyHTML);
    $("importJsonBtn").addEventListener("click", handleImport);
    $("loadExampleBtn").addEventListener("click", loadExample);
    $("validateSchemaBtn").addEventListener("click", validateSchema);

    jsonOutput.addEventListener("input", () => {
        clearValidation();
    });

    /* ==========================================
       INITIALIZE
    ========================================== */

    renderForm("Organization");
    renderSchemaList();

    console.info("Helpy Anand Schema Markup Generator initialized.");
})();
