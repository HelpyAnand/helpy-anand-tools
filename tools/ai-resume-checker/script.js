import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // NAVBAR & FOOTER
    // =========================

    fetch("../../components/navbar.html")
        .then(response => response.text())
        .then(data => {
            const navbar = document.getElementById("navbar-container");
            if (navbar) navbar.innerHTML = data;
        })
        .catch(error => console.error("Navbar error:", error));

    fetch("../../components/footer.html")
        .then(response => response.text())
        .then(data => {
            const footer = document.getElementById("footer-container");
            if (footer) footer.innerHTML = data;
        })
        .catch(error => console.error("Footer error:", error));


    // =========================
    // DOM ELEMENTS
    // =========================

    const resumeFile = document.getElementById("resumeFile");
    const jobDescription = document.getElementById("jobDescription");
    const checkResumeBtn = document.getElementById("checkResumeBtn");
    const resetBtn = document.getElementById("resetBtn");
    const statusMessage = document.getElementById("statusMessage");
    const results = document.getElementById("results");


    // =========================
    // STOP WORDS
    // =========================

    const stopWords = new Set([
        "the", "and", "for", "with", "that", "this", "from",
        "have", "has", "will", "your", "you", "are", "was",
        "were", "our", "their", "they", "them", "his", "her",
        "she", "he", "but", "not", "all", "can", "job",
        "work", "working", "role", "position", "team",
        "about", "into", "using", "used", "use", "who",
        "what", "when", "where", "how", "why", "years",
        "year", "required", "preferred", "skills", "experience"
    ]);


    // =========================
    // CHECK RESUME
    // =========================

    checkResumeBtn.addEventListener("click", async () => {

        const file = resumeFile.files[0];
        const jdText = jobDescription.value.trim();

        if (!file) {
            statusMessage.textContent = "Please upload your resume.";
            statusMessage.style.color = "red";
            return;
        }

        if (!jdText) {
            statusMessage.textContent =
                "Please paste the job description.";
            statusMessage.style.color = "red";
            return;
        }

        checkResumeBtn.disabled = true;

        statusMessage.textContent =
            "Analyzing your resume... Please wait.";
        statusMessage.style.color = "";

        // IMPORTANT:
        // Use hidden attribute only.
        results.hidden = true;
        results.classList.remove("hidden");

        try {

            // =========================
            // READ RESUME
            // =========================

            const resumeText = await readResumeFile(file);

            if (!resumeText || resumeText.trim().length < 20) {
                throw new Error(
                    "Could not extract enough text from the resume."
                );
            }


            // =========================
            // KEYWORD ANALYSIS
            // =========================

            const keywordAnalysis =
                analyzeKeywords(resumeText, jdText);


            // =========================
            // FORMATTING ANALYSIS
            // =========================

            const formattingAnalysis =
                analyzeFormatting(resumeText);


            // =========================
            // CONTENT ANALYSIS
            // =========================

            const contentAnalysis =
                analyzeContent(resumeText);


            // =========================
            // SECTION ANALYSIS
            // =========================

            const sectionAnalysis =
                analyzeSections(resumeText);


            // =========================
            // READABILITY ANALYSIS
            // =========================

            const readabilityAnalysis =
                analyzeReadability(resumeText);


            // =========================
            // UPDATE SCORE BREAKDOWN
            // =========================

            document.getElementById("keywordScore").textContent =
                keywordAnalysis.keywordScore + " / 35";

            document.getElementById("formattingScore").textContent =
                formattingAnalysis.formattingScore + " / 25";

            document.getElementById("contentScore").textContent =
                contentAnalysis.contentScore + " / 20";

            document.getElementById("sectionScore").textContent =
                sectionAnalysis.sectionScore + " / 10";

            document.getElementById("readabilityScore").textContent =
                readabilityAnalysis.readabilityScore + " / 10";


            // =========================
            // KEYWORDS
            // =========================

            const matchedKeywords =
                document.getElementById("matchedKeywords");

            const missingKeywords =
                document.getElementById("missingKeywords");

            matchedKeywords.textContent =
                keywordAnalysis.matched.length
                    ? keywordAnalysis.matched.join(", ")
                    : "None";

            missingKeywords.textContent =
                keywordAnalysis.missing.length
                    ? keywordAnalysis.missing.join(", ")
                    : "None";


            // =========================
            // SECTION CHECKS
            // =========================

            document.getElementById("contactCheck").textContent =
                sectionAnalysis.sections.contact
                    ? "✅ Contact information found"
                    : "⚠️ Contact information missing";

            document.getElementById("summaryCheck").textContent =
                sectionAnalysis.sections.summary
                    ? "✅ Summary / Objective found"
                    : "⚠️ Summary / Objective missing";

            document.getElementById("experienceCheck").textContent =
                sectionAnalysis.sections.experience
                    ? "✅ Experience section found"
                    : "⚠️ Experience section missing";

            document.getElementById("educationCheck").textContent =
                sectionAnalysis.sections.education
                    ? "✅ Education section found"
                    : "⚠️ Education section missing";

            document.getElementById("skillsCheck").textContent =
                sectionAnalysis.sections.skills
                    ? "✅ Skills section found"
                    : "⚠️ Skills section missing";


            // =========================
            // FINAL ATS SCORE
            // =========================

            const finalATSScore =
                keywordAnalysis.keywordScore +
                formattingAnalysis.formattingScore +
                contentAnalysis.contentScore +
                sectionAnalysis.sectionScore +
                readabilityAnalysis.readabilityScore;

            document.getElementById("atsScore").textContent =
                finalATSScore;


            // =========================
            // SUGGESTIONS
            // =========================

            generateSuggestions({
                keywordAnalysis,
                formattingAnalysis,
                contentAnalysis,
                sectionAnalysis,
                readabilityAnalysis,
                finalATSScore
            });


            // =========================
            // SHOW RESULTS
            // =========================

            results.classList.remove("hidden");
            results.hidden = false;

            statusMessage.textContent =
                "Resume analysis completed successfully.";

            statusMessage.style.color = "green";

        } catch (error) {

            console.error("Resume analysis error:", error);

            statusMessage.textContent =
                "Error: " + error.message;

            statusMessage.style.color = "red";

        } finally {

            checkResumeBtn.disabled = false;
        }
    });


    // =========================================================
    // READ RESUME FILE
    // =========================================================

    async function readResumeFile(file) {

        const fileName = file.name.toLowerCase();

        // =========================
        // TXT
        // =========================

        if (fileName.endsWith(".txt")) {
            return await file.text();
        }


        // =========================
        // DOCX
        // =========================

        if (fileName.endsWith(".docx")) {

            if (typeof mammoth === "undefined") {
                throw new Error(
                    "DOCX reader is not available."
                );
            }

            const arrayBuffer =
                await file.arrayBuffer();

            const result =
                await mammoth.extractRawText({
                    arrayBuffer: arrayBuffer
                });

            return result.value || "";
        }


        // =========================
        // PDF
        // =========================

        if (fileName.endsWith(".pdf")) {

            return await extractPdfText(file);
        }


        throw new Error(
            "Unsupported file format. Please upload PDF, DOCX or TXT."
        );
    }


    // =========================================================
    // PDF TEXT EXTRACTION
    // =========================================================

    async function extractPdfText(file) {

        const arrayBuffer =
            await file.arrayBuffer();

        const pdf =
            await pdfjsLib.getDocument({
                data: arrayBuffer
            }).promise;

        let fullText = "";

        for (let pageNumber = 1;
             pageNumber <= pdf.numPages;
             pageNumber++) {

            const page =
                await pdf.getPage(pageNumber);

            const textContent =
                await page.getTextContent();

            const pageText =
                textContent.items
                    .map(item => item.str)
                    .join(" ");

            fullText += pageText + "\n";
        }


        // If enough text was extracted,
        // return it directly.
        if (fullText.trim().length >= 50) {
            return fullText;
        }


        // =========================
        // OCR FALLBACK
        // =========================

        if (typeof Tesseract === "undefined") {
            return fullText;
        }

        let ocrText = "";

        for (let pageNumber = 1;
             pageNumber <= pdf.numPages;
             pageNumber++) {

            const page =
                await pdf.getPage(pageNumber);

            const viewport =
                page.getViewport({
                    scale: 1.5
                });

            const canvas =
                document.createElement("canvas");

            const context =
                canvas.getContext("2d");

            canvas.width =
                viewport.width;

            canvas.height =
                viewport.height;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            const result =
                await Tesseract.recognize(
                    canvas,
                    "eng"
                );

            ocrText +=
                result.data.text + "\n";
        }

        return ocrText;
    }


    // =========================================================
    // KEYWORD ANALYSIS
    // =========================================================

    function analyzeKeywords(resumeText, jdText) {

        const resume =
            resumeText.toLowerCase();

        const jd =
            jdText.toLowerCase();


        const words =
            jd.match(
                /\b[a-zA-Z][a-zA-Z0-9+#.-]{1,}\b/g
            ) || [];


        const uniqueKeywords =
            [...new Set(
                words.filter(word =>
                    !stopWords.has(word) &&
                    word.length >= 3
                )
            )];


        const matched = [];
        const missing = [];


        uniqueKeywords.forEach(keyword => {

            if (resume.includes(keyword)) {
                matched.push(keyword);
            } else {
                missing.push(keyword);
            }

        });


        let keywordScore = 0;

        if (uniqueKeywords.length > 0) {

            keywordScore =
                Math.round(
                    (matched.length /
                        uniqueKeywords.length) * 35
                );
        }


        return {
            all: uniqueKeywords,
            matched: matched,
            missing: missing,
            keywordScore: keywordScore
        };
    }


    // =========================================================
    // FORMATTING ANALYSIS
    // =========================================================

    function analyzeFormatting(resumeText) {

        let score = 0;

        // Resume length
        if (resumeText.length >= 200) {
            score += 5;
        } else if (resumeText.length >= 100) {
            score += 3;
        }


        // Email
        const hasEmail =
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
                .test(resumeText);


        // Phone
        const hasPhone =
            /\+?\d[\d\s().-]{8,}\d/
                .test(resumeText);


        if (hasEmail && hasPhone) {
            score += 5;
        } else if (hasEmail || hasPhone) {
            score += 3;
        }


        // Headings
        const headingPattern =
            /\b(summary|objective|profile|experience|employment|education|skills|technical skills|projects|certifications|achievements|awards|languages|interests)\b/gi;

        const headings =
            resumeText.match(headingPattern) || [];

        const uniqueHeadings =
            [...new Set(
                headings.map(h => h.toLowerCase())
            )];


        if (uniqueHeadings.length >= 3) {
            score += 5;
        } else if (uniqueHeadings.length === 2) {
            score += 3;
        } else if (uniqueHeadings.length === 1) {
            score += 1;
        }


        // Line structure
        const lines =
            resumeText
                .split(/\r?\n/)
                .filter(line => line.trim().length > 0);


        if (lines.length >= 15 &&
            lines.length <= 300) {

            score += 5;

        } else if (lines.length >= 8) {

            score += 3;
        }


        // Bad symbols / very long lines
        const hasBadSymbols =
            /[•]{5,}|[|]{5,}|[_]{8,}|[-]{10,}/
                .test(resumeText);

        const hasVeryLongLine =
            lines.some(line => line.length > 250);


        if (!hasBadSymbols &&
            !hasVeryLongLine) {

            score += 5;

        } else if (!hasVeryLongLine) {

            score += 3;
        }


        return {
            formattingScore: Math.min(score, 25)
        };
    }


    // =========================================================
    // CONTENT ANALYSIS
    // =========================================================

    function analyzeContent(resumeText) {

        const text =
            resumeText.toLowerCase();

        let score = 0;


        // Resume length / detail
        const wordCount =
            text.split(/\s+/)
                .filter(Boolean)
                .length;


        if (wordCount >= 400) {
            score += 5;
        } else if (wordCount >= 250) {
            score += 4;
        } else if (wordCount >= 150) {
            score += 2;
        }


        // Action words
        const actionWords = [
            "managed",
            "developed",
            "created",
            "designed",
            "implemented",
            "led",
            "improved",
            "increased",
            "reduced",
            "optimized",
            "built",
            "delivered",
            "achieved",
            "coordinated",
            "analyzed",
            "maintained",
            "launched",
            "automated"
        ];


        const actionCount =
            actionWords.filter(word =>
                text.includes(word)
            ).length;


        if (actionCount >= 6) {
            score += 5;
        } else if (actionCount >= 3) {
            score += 3;
        } else if (actionCount >= 1) {
            score += 1;
        }


        // Numbers / achievements
        const numberMatches =
            text.match(
                /\b\d+(?:\.\d+)?%?\b/g
            ) || [];


        if (numberMatches.length >= 6) {
            score += 5;
        } else if (numberMatches.length >= 3) {
            score += 3;
        } else if (numberMatches.length >= 1) {
            score += 1;
        }


        // Professional words
        const professionalWords = [
            "responsibility",
            "leadership",
            "teamwork",
            "communication",
            "problem-solving",
            "strategy",
            "performance",
            "project",
            "client",
            "customer",
            "deadline",
            "collaboration",
            "solution"
        ];


        const professionalCount =
            professionalWords.filter(word =>
                text.includes(word)
            ).length;


        if (professionalCount >= 5) {
            score += 5;
        } else if (professionalCount >= 3) {
            score += 3;
        } else if (professionalCount >= 1) {
            score += 1;
        }


        return {
            contentScore: Math.min(score, 20)
        };
    }


    // =========================================================
    // SECTION ANALYSIS
    // =========================================================

    function analyzeSections(resumeText) {

        const text =
            resumeText.toLowerCase();


        const sections = {

            contact:
                /@|email|phone|mobile|contact|\+\d/
                    .test(text),

            summary:
                /\b(summary|professional summary|objective|profile|career objective)\b/
                    .test(text),

            experience:
                /\b(experience|work experience|employment|professional experience)\b/
                    .test(text),

            education:
                /\b(education|academic|qualification|degree|university|college)\b/
                    .test(text),

            skills:
                /\b(skills|technical skills|core skills|key skills|competencies)\b/
                    .test(text)
        };


        let score = 0;

        Object.values(sections)
            .forEach(found => {

                if (found) {
                    score += 2;
                }

            });


        return {
            sectionScore: Math.min(score, 10),
            sections: sections
        };
    }


    // =========================================================
    // READABILITY ANALYSIS
    // =========================================================

    function analyzeReadability(resumeText) {

        const words =
            resumeText
                .split(/\s+/)
                .filter(Boolean);


        const wordCount =
            words.length;


        let score = 0;


        // Word count
        if (wordCount >= 250 &&
            wordCount <= 900) {

            score += 3;

        } else if (wordCount >= 150) {

            score += 2;

        } else if (wordCount >= 80) {

            score += 1;
        }


        // Sentence length
        const sentences =
            resumeText
                .split(/[.!?]+/)
                .filter(sentence =>
                    sentence.trim().length > 0
                );


        let longSentences = 0;

        sentences.forEach(sentence => {

            const count =
                sentence
                    .trim()
                    .split(/\s+/)
                    .length;

            if (count > 35) {
                longSentences++;
            }

        });


        if (longSentences === 0) {
            score += 3;
        } else if (longSentences <= 2) {
            score += 2;
        } else {
            score += 1;
        }


        // Special symbol usage
        const symbolMatches =
            resumeText.match(
                /[^\w\s.,;:!?@()+/#&%$'-]/g
            ) || [];


        if (symbolMatches.length < 20) {
            score += 2;
        } else if (symbolMatches.length < 40) {
            score += 1;
        }


        // Line structure
        const lines =
            resumeText
                .split(/\r?\n/)
                .filter(line => line.trim());


        if (lines.length >= 15) {
            score += 2;
        } else if (lines.length >= 8) {
            score += 1;
        }


        return {
            readabilityScore: Math.min(score, 10)
        };
    }


    // =========================================================
    // SUGGESTIONS
    // =========================================================

    function generateSuggestions(data) {

        const suggestionsList =
            document.getElementById("suggestionsList");

        suggestionsList.innerHTML = "";


        function addSuggestion(text) {

            const li =
                document.createElement("li");

            li.textContent = text;

            suggestionsList.appendChild(li);
        }


        // Missing keywords
        if (data.keywordAnalysis.missing.length > 0) {

            const keywords =
                data.keywordAnalysis.missing
                    .slice(0, 8)
                    .join(", ");

            addSuggestion(
                "Add relevant job keywords naturally: " +
                keywords
            );
        }


        // Formatting
        if (data.formattingAnalysis.formattingScore < 20) {

            addSuggestion(
                "Improve resume formatting with clear headings, contact details and consistent sections."
            );
        }


        // Content
        if (data.contentAnalysis.contentScore < 15) {

            addSuggestion(
                "Add measurable achievements, action verbs and specific results from your work."
            );
        }


        // Sections
        if (data.sectionAnalysis.sectionScore < 10) {

            addSuggestion(
                "Make sure your resume includes Contact, Summary, Experience, Education and Skills sections."
            );
        }


        // Readability
        if (data.readabilityAnalysis.readabilityScore < 8) {

            addSuggestion(
                "Improve readability by using shorter sentences, clear bullet points and simple formatting."
            );
        }


        // Overall score
        if (data.finalATSScore >= 85) {

            addSuggestion(
                "Excellent ATS score. Your resume is well optimized for the provided job description."
            );

        } else if (data.finalATSScore >= 70) {

            addSuggestion(
                "Good ATS score. A few keyword and content improvements can make your resume stronger."
            );

        } else if (data.finalATSScore >= 50) {

            addSuggestion(
                "Your resume has a moderate ATS score. Focus on missing keywords and measurable achievements."
            );

        } else {

            addSuggestion(
                "Your ATS score is low. Improve keyword matching, resume sections, formatting and measurable achievements."
            );
        }
    }


    // =========================================================
    // RESET
    // =========================================================

    resetBtn.addEventListener("click", () => {

        resumeFile.value = "";
        jobDescription.value = "";

        statusMessage.textContent = "";
        statusMessage.style.color = "";

        // Hide results correctly
        results.hidden = true;
        results.classList.remove("hidden");


        // Reset ATS
        document.getElementById("atsScore").textContent =
            "0";


        // Reset breakdown
        document.getElementById("keywordScore").textContent =
            "0 / 35";

        document.getElementById("formattingScore").textContent =
            "0 / 25";

        document.getElementById("contentScore").textContent =
            "0 / 20";

        document.getElementById("sectionScore").textContent =
            "0 / 10";

        document.getElementById("readabilityScore").textContent =
            "0 / 10";


        // Reset keywords
        document.getElementById("matchedKeywords").textContent =
            "None";

        document.getElementById("missingKeywords").textContent =
            "None";


        // Reset sections
        document.getElementById("contactCheck").textContent =
            "⚠️ Contact information";

        document.getElementById("summaryCheck").textContent =
            "⚠️ Summary / Objective";

        document.getElementById("experienceCheck").textContent =
            "⚠️ Experience";

        document.getElementById("educationCheck").textContent =
            "⚠️ Education";

        document.getElementById("skillsCheck").textContent =
            "⚠️ Skills";


        // Clear suggestions
        document.getElementById("suggestionsList").innerHTML =
            "";

        checkResumeBtn.disabled = false;
    });

});