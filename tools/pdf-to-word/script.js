
console.log("🚨🚨 CURRENT SCRIPT 270927 LOADED 🚨🚨");



console.log("### NEW SCRIPT FILE LOADED ###");



console.log("=================================");
console.log("DOCX LIBRARY CHECK");
console.log("=================================");

console.log(
    "window.docx:",
    window.docx
);

console.log(
    "window.pdfjsLib:",
    window.pdfjsLib
);

console.log("=================================");



console.log("=================================");
console.log("FREE PDF → WORD");
console.log("STEP 1 — PDF ANALYZER");
console.log("=================================");

const pdfFile = document.getElementById("pdfFile");
const convertBtn = document.getElementById("convertBtn");

let selectedPDF = null;


/* ================================
   PDF FILE SELECT
================================ */

pdfFile.addEventListener("change", function () {

    selectedPDF = this.files[0];

    if (!selectedPDF) {
        console.log("No PDF selected");
        return;
    }

    console.log("FILE NAME:", selectedPDF.name);
    console.log("FILE SIZE:", selectedPDF.size, "bytes");
    console.log("FILE TYPE:", selectedPDF.type);

    if (selectedPDF.type !== "application/pdf") {

        alert("Please select a PDF file.");

        selectedPDF = null;
        convertBtn.disabled = true;

        return;
    }

    convertBtn.disabled = false;

    console.log("PDF SELECTED SUCCESSFULLY");

    

});



console.log("🔥 AFTER PDF SELECTED — PROCESSING START 🔥");
console.log("🔥 STEP 1 — BEFORE PDF LOAD 🔥");


/* ================================
   CONVERT BUTTON
================================ */

convertBtn.addEventListener("click", async function () {

    if (!selectedPDF) {

        alert("Please select a PDF file first.");

        return;
    }

    console.log("=================================");
    console.log("STEP 1 TEST START");
    console.log("=================================");

    try {

        const arrayBuffer = await selectedPDF.arrayBuffer();

        console.log(
            "PDF ARRAYBUFFER SIZE:",
            arrayBuffer.byteLength,
            "bytes"
        );

        const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer
        }).promise;

        console.log("PDF LOADED SUCCESSFULLY");

        console.log(
            "TOTAL PAGES:",
            pdf.numPages
        );


        /* ================================
           READ FIRST PAGE
        ================================= */

        const page = await pdf.getPage(1);

        const viewport = page.getViewport({
            scale: 1
        });

        console.log("PAGE WIDTH:", viewport.width);
        console.log("PAGE HEIGHT:", viewport.height);
        console.log("PAGE ROTATION:", page.rotate);


        /* ================================
           TEXT CONTENT
        ================================= */

        const textContent = await page.getTextContent();

        console.log(
            "TEXT ITEMS:",
            textContent.items.length
        );




        /* =================================
   STEP 2 — EXACT TEXT MODEL
================================= */

const step2Items = [];

textContent.items.forEach(function (item, index) {

    const transform = item.transform;

    const x = transform[4];
    const y = transform[5];

    const fontSize = Math.sqrt(
        (transform[0] * transform[0]) +
        (transform[1] * transform[1])
    );

    step2Items.push({

        index: index,

        text: item.str,

        x: Number(x.toFixed(4)),

        y: Number(y.toFixed(4)),

        width: Number(
            (item.width || 0).toFixed(4)
        ),

        height: Number(
            (item.height || fontSize).toFixed(4)
        ),

        fontSize: Number(
            fontSize.toFixed(4)
        )

    });

});


/* =================================
   SAVE STEP 2 MODEL
================================= */

window.pdfFreeWordTextModel = {

    version: "STEP-2",

    page: 1,

    pageWidth: viewport.width,

    pageHeight: viewport.height,

    textCount: step2Items.length,

    items: step2Items

};


/* =================================
   STEP 2 RESULT
================================= */

console.log("=================================");
console.log("STEP 2 MODEL CREATED");
console.log("=================================");

console.log(
    "PAGE:",
    window.pdfFreeWordTextModel.page
);

console.log(
    "PAGE WIDTH:",
    window.pdfFreeWordTextModel.pageWidth
);

console.log(
    "PAGE HEIGHT:",
    window.pdfFreeWordTextModel.pageHeight
);

console.log(
    "TEXT COUNT:",
    window.pdfFreeWordTextModel.textCount
);

console.log("---------- FIRST 10 ITEMS ----------");

console.table(
    window.pdfFreeWordTextModel.items.slice(0, 10)
);

console.log("=================================");
console.log("STEP 2 TEST COMPLETE");
console.log("=================================");



/* =================================
   STEP 3 — TEXT LINE MODEL
================================= */

const step3Items =
    window.pdfFreeWordTextModel.items;


/* ---------------------------------
   LINE TOLERANCE
--------------------------------- */

const step3Tolerance = 2;


/* ---------------------------------
   CREATE LINES
--------------------------------- */

const step3Lines = [];

step3Items.forEach(function (item) {

    // Empty text ignore करें
    if (!item.text || !item.text.trim()) {
        return;
    }

    let matchedLine = null;

    for (let i = 0; i < step3Lines.length; i++) {

        const line = step3Lines[i];

        if (
            Math.abs(line.y - item.y)
            <= step3Tolerance
        ) {
            matchedLine = line;
            break;
        }
    }


    // Existing line मिली
    if (matchedLine) {

        matchedLine.items.push(item);

        matchedLine.text += item.text;

        matchedLine.x =
            Math.min(
                matchedLine.x,
                item.x
            );

        matchedLine.right =
            Math.max(
                matchedLine.right,
                item.x + item.width
            );

        return;
    }


    // नई line
    step3Lines.push({

        lineIndex: step3Lines.length,

        y: item.y,

        x: item.x,

        right: item.x + item.width,

        width: item.width,

        text: item.text,

        items: [item]

    });

});


/* ---------------------------------
   FINAL LINE WIDTH
--------------------------------- */

step3Lines.forEach(function (line) {

    line.width =
        line.right - line.x;

});


/* ---------------------------------
   SORT LINES
--------------------------------- */

step3Lines.sort(function (a, b) {

    return b.y - a.y;

});


/* ---------------------------------
   SAVE MODEL
--------------------------------- */

window.pdfFreeWordLineModel = {

    version: "STEP-3",

    page: 1,

    pageWidth:
        window.pdfFreeWordTextModel.pageWidth,

    pageHeight:
        window.pdfFreeWordTextModel.pageHeight,

    lineCount:
        step3Lines.length,

    lines: step3Lines

};


/* =================================
   STEP 3 RESULT
================================= */

console.log("=================================");
console.log("STEP 3 LINE MODEL CREATED");
console.log("=================================");

console.log(
    "LINE COUNT:",
    window.pdfFreeWordLineModel.lineCount
);

console.log("---------- FIRST 20 LINES ----------");

console.table(

    window.pdfFreeWordLineModel.lines
        .slice(0, 20)
        .map(function (line) {

            return {

                lineIndex: line.lineIndex,

                text: line.text,

                x: Number(line.x.toFixed(2)),

                y: Number(line.y.toFixed(2)),

                width: Number(line.width.toFixed(2)),

                items: line.items.length

            };

        })

);

console.log("=================================");
console.log("STEP 3 TEST COMPLETE");
console.log("=================================");





/* =================================
   STEP 4 — EXACT TEXT SPACING MODEL
================================= */

const step4Items =
    window.pdfFreeWordTextModel.items;


/* ---------------------------------
   GROUP ITEMS BY SAME Y POSITION
--------------------------------- */

const step4Lines = [];

const step4Tolerance = 2;

step4Items.forEach(function (item) {

    let line = null;

    for (let i = 0; i < step4Lines.length; i++) {

        if (
            Math.abs(
                step4Lines[i].y - item.y
            ) <= step4Tolerance
        ) {
            line = step4Lines[i];
            break;
        }

    }


    if (!line) {

        line = {

            y: item.y,

            items: []

        };

        step4Lines.push(line);

    }


    line.items.push(item);

});


/* ---------------------------------
   SORT ITEMS BY X POSITION
--------------------------------- */

step4Lines.forEach(function (line) {

    line.items.sort(function (a, b) {

        return a.x - b.x;

    });

});


/* ---------------------------------
   REBUILD TEXT WITH SPACING
--------------------------------- */

const step4ResultLines = [];

step4Lines.forEach(function (line, lineIndex) {

    let resultText = "";

    let previousRight = null;


    line.items.forEach(function (item) {

        const text = item.text;

        /*
         * Ignore completely empty PDF item
         */
        if (
            text === "" &&
            item.width === 0
        ) {
            return;
        }


        /*
         * Calculate visual gap
         */
        if (previousRight !== null) {

            const gap =
                item.x - previousRight;


            /*
             * PDF text item already contains
             * its own spaces.
             *
             * Add extra space only when
             * there is a meaningful visual gap.
             */

            if (
                gap > 2.5 &&
                resultText.length > 0 &&
                !resultText.endsWith(" ")
            ) {

                resultText += " ";

            }

        }


        resultText += text;


        previousRight =
            item.x + item.width;

    });


    step4ResultLines.push({

        lineIndex: lineIndex,

        y: line.y,

        x:
            line.items.length > 0
                ? line.items[0].x
                : 0,

        text: resultText

    });

});


/* ---------------------------------
   SORT TOP → BOTTOM
--------------------------------- */

step4ResultLines.sort(function (a, b) {

    return b.y - a.y;

});


/* ---------------------------------
   RE-INDEX AFTER SORT
--------------------------------- */

step4ResultLines.forEach(function (line, index) {

    line.lineIndex = index;

});


/* ---------------------------------
   SAVE STEP 4 MODEL
--------------------------------- */

window.pdfFreeWordExactLineModel = {

    version: "STEP-4",

    page: 1,

    pageWidth:
        window.pdfFreeWordTextModel.pageWidth,

    pageHeight:
        window.pdfFreeWordTextModel.pageHeight,

    lineCount:
        step4ResultLines.length,

    lines:
        step4ResultLines

};


/* =================================
   STEP 4 RESULT
================================= */

console.log("=================================");
console.log("STEP 4 EXACT TEXT MODEL CREATED");
console.log("=================================");

console.log(
    "LINE COUNT:",
    window.pdfFreeWordExactLineModel.lineCount
);

console.log("---------- RECONSTRUCTED TEXT ----------");

console.table(

    window.pdfFreeWordExactLineModel.lines.map(
        function (line) {

            return {

                lineIndex: line.lineIndex,

                text: line.text,

                x:
                    Number(
                        line.x.toFixed(2)
                    ),

                y:
                    Number(
                        line.y.toFixed(2)
                    )

            };

        }
    )

);

console.log("=================================");
console.log("STEP 4 TEST COMPLETE");
console.log("=================================");




/* =================================
   STEP 5 — EXACT LINE POSITION MODEL
================================= */

const step5Source =
    window.pdfFreeWordExactLineModel.lines;

const step5TextItems =
    window.pdfFreeWordTextModel.items;


/* ---------------------------------
   BUILD POSITION MODEL
--------------------------------- */

const step5Lines = [];

step5Source.forEach(function (line, index) {

    const matchingItems =
        step5TextItems.filter(function (item) {

            return (
                Math.abs(item.y - line.y) <= 2 &&
                item.text !== ""
            );

        });


    let right = line.x;

    let top = line.y;

    let bottom = line.y;

    let fontSize = 0;

    let height = 0;


    matchingItems.forEach(function (item) {

        right = Math.max(
            right,
            item.x + item.width
        );


        fontSize = Math.max(
            fontSize,
            item.fontSize || 0
        );


        height = Math.max(
            height,
            item.height || 0
        );

    });


    step5Lines.push({

        lineIndex: index,

        text: line.text,

        x: Number(
            line.x.toFixed(4)
        ),

        y: Number(
            line.y.toFixed(4)
        ),

        right: Number(
            right.toFixed(4)
        ),

        width: Number(
            (right - line.x).toFixed(4)
        ),

        height: Number(
            height.toFixed(4)
        ),

        fontSize: Number(
            fontSize.toFixed(4)
        )

    });

});


/* ---------------------------------
   SAVE STEP 5 MODEL
--------------------------------- */

window.pdfFreeWordPositionModel = {

    version: "STEP-5",

    page: 1,

    pageWidth:
        window.pdfFreeWordTextModel.pageWidth,

    pageHeight:
        window.pdfFreeWordTextModel.pageHeight,

    lineCount:
        step5Lines.length,

    lines:
        step5Lines

};


/* =================================
   STEP 5 RESULT
================================= */

console.log("=================================");
console.log("STEP 5 POSITION MODEL CREATED");
console.log("=================================");

console.log(
    "PAGE WIDTH:",
    window.pdfFreeWordPositionModel.pageWidth
);

console.log(
    "PAGE HEIGHT:",
    window.pdfFreeWordPositionModel.pageHeight
);

console.log(
    "LINE COUNT:",
    window.pdfFreeWordPositionModel.lineCount
);

console.log("---------- POSITION MODEL ----------");

console.table(
    window.pdfFreeWordPositionModel.lines
);

console.log("=================================");
console.log("STEP 5 TEST COMPLETE");
console.log("=================================");




/* =================================
   STEP 6 — PDF → DOCX COORDINATE MODEL
================================= */

const step6Source =
    window.pdfFreeWordPositionModel;


/* ---------------------------------
   DOCX PAGE SIZE
--------------------------------- */

/*
 * PDF points are already close to
 * Word points.
 *
 * 1 PDF point = 1/72 inch
 *
 * For this first model we keep
 * the same coordinate scale.
 */

const step6PageWidth =
    step6Source.pageWidth;

const step6PageHeight =
    step6Source.pageHeight;


/* ---------------------------------
   CREATE DOCX POSITION MODEL
--------------------------------- */

const step6Lines =
    step6Source.lines.map(function (line) {

        /*
         * PDF Y starts from bottom.
         *
         * Word positioning starts
         * from top.
         *
         * Therefore:
         *
         * top =
         * pageHeight - PDF Y
         */

        const top =
            step6PageHeight - line.y;


        return {

            lineIndex:
                line.lineIndex,

            text:
                line.text,

            pdfX:
                line.x,

            pdfY:
                line.y,

            docxLeft:
                Number(
                    line.x.toFixed(4)
                ),

            docxTop:
                Number(
                    top.toFixed(4)
                ),

            width:
                Number(
                    line.width.toFixed(4)
                ),

            height:
                Number(
                    line.height.toFixed(4)
                ),

            fontSize:
                Number(
                    line.fontSize.toFixed(4)
                )

        };

    });


/* ---------------------------------
   SAVE STEP 6 MODEL
--------------------------------- */

window.pdfFreeWordDocxPositionModel = {

    version: "STEP-6",

    page: 1,

    pdfPageWidth:
        step6PageWidth,

    pdfPageHeight:
        step6PageHeight,

    docxPageWidth:
        step6PageWidth,

    docxPageHeight:
        step6PageHeight,

    lineCount:
        step6Lines.length,

    lines:
        step6Lines

};


/* =================================
   STEP 6 RESULT
================================= */

console.log("=================================");
console.log("STEP 6 DOCX POSITION MODEL CREATED");
console.log("=================================");

console.log(
    "PDF PAGE:",
    step6PageWidth,
    "x",
    step6PageHeight
);

console.log(
    "DOCX PAGE:",
    step6Source.pageWidth,
    "x",
    step6Source.pageHeight
);

console.log(
    "LINE COUNT:",
    step6Lines.length
);

console.log("---------- DOCX POSITION MODEL ----------");

console.table(

    step6Lines.map(function (line) {

        return {

            lineIndex:
                line.lineIndex,

            text:
                line.text,

            pdfX:
                line.pdfX,

            pdfY:
                line.pdfY,

            docxLeft:
                line.docxLeft,

            docxTop:
                line.docxTop,

            width:
                line.width,

            height:
                line.height,

            fontSize:
                line.fontSize

        };

    })

);

console.log("=================================");
console.log("STEP 6 TEST COMPLETE");
console.log("=================================");




/* =================================
   STEP 7 — DOCX PAGE SETUP MODEL
================================= */

const step7Source =
    window.pdfFreeWordDocxPositionModel;


/* ---------------------------------
   PDF PAGE → DOCX PAGE
--------------------------------- */

const step7PageWidth =
    step7Source.docxPageWidth;

const step7PageHeight =
    step7Source.docxPageHeight;


/* ---------------------------------
   PAGE MARGINS
--------------------------------- */

/*
 * PDF coordinates start from the
 * actual page boundary.
 *
 * Therefore we use zero margins
 * for the positioning prototype.
 */

const step7Margins = {

    top: 0,

    right: 0,

    bottom: 0,

    left: 0

};


/* ---------------------------------
   SAVE PAGE SETUP
--------------------------------- */

window.pdfFreeWordDocxPageModel = {

    version: "STEP-7",

    page: 1,

    width:
        step7PageWidth,

    height:
        step7PageHeight,

    margins:
        step7Margins,

    orientation:
        step7PageWidth > step7PageHeight
            ? "landscape"
            : "portrait",

    lines:
        step7Source.lines

};


/* =================================
   STEP 7 RESULT
================================= */

console.log("=================================");
console.log("STEP 7 DOCX PAGE MODEL CREATED");
console.log("=================================");

console.log(
    "DOCX WIDTH:",
    window.pdfFreeWordDocxPageModel.width
);

console.log(
    "DOCX HEIGHT:",
    window.pdfFreeWordDocxPageModel.height
);

console.log(
    "ORIENTATION:",
    window.pdfFreeWordDocxPageModel.orientation
);

console.log(
    "MARGINS:",
    window.pdfFreeWordDocxPageModel.margins
);

console.log(
    "LINES:",
    window.pdfFreeWordDocxPageModel.lines.length
);

console.log("=================================");
console.log("STEP 7 TEST COMPLETE");
console.log("=================================");




/* =================================
   STEP 8 — DOCX TEXT PLACEMENT
   PROTOTYPE
================================= */

const step8Source =
    window.pdfFreeWordDocxPageModel;

console.log("=================================");
console.log("STEP 8 — DOCX TEXT PLACEMENT");
console.log("=================================");


/* ---------------------------------
   CHECK DOCX LIBRARY
--------------------------------- */

if (
    typeof docx === "undefined"
) {
    throw new Error(
        "DOCX library not loaded."
    );
}

const {
    Document,
    Packer,
    Paragraph,
    TextRun
} = docx;


/* ---------------------------------
   CREATE DOCUMENT
--------------------------------- */

const step8Doc = new Document({

    sections: [

        {

            properties: {

                page: {

                    width:
                        Math.round(
                            step8Source.width * 20
                        ),

                    height:
                        Math.round(
                            step8Source.height * 20
                        ),

                    margin: {

                        top: 0,

                        right: 0,

                        bottom: 0,

                        left: 0

                    }

                }

            },

            children: [

                new Paragraph({

                    children: [

                        new TextRun({
                            text: "STEP 8 TEST"
                        })

                    ]

                })

            ]

        }

    ]

});


/* ---------------------------------
   SAVE MODEL
--------------------------------- */

window.pdfFreeWordDocxPrototype = {

    version: "STEP-8",

    width:
        step8Source.width,

    height:
        step8Source.height,

    lineCount:
        step8Source.lines.length,

    document:
        step8Doc

};


/* =================================
   RESULT
================================= */

console.log(
    "DOCX DOCUMENT CREATED"
);

console.log(
    "PAGE WIDTH:",
    step8Source.width
);

console.log(
    "PAGE HEIGHT:",
    step8Source.height
);

console.log(
    "LINES:",
    step8Source.lines.length
);

console.log("=================================");
console.log("STEP 8 TEST COMPLETE");
console.log("=================================");




/* =================================
   STEP 9 — FIRST TEXT POSITION
   PROTOTYPE
================================= */

const step9Source =
    window.pdfFreeWordDocxPageModel;

console.log("=================================");
console.log("STEP 9 — FIRST TEXT POSITION");
console.log("=================================");


/* ---------------------------------
   FIRST 3 LINES ONLY
--------------------------------- */

const step9Lines =
    step9Source.lines.slice(0, 3);

console.log(
    "TEST LINES:",
    step9Lines.length
);


/* ---------------------------------
   SHOW COORDINATES
--------------------------------- */

step9Lines.forEach(function (line) {

    console.log(
        "LINE:",
        line.lineIndex,
        "| TEXT:",
        line.text,
        "| LEFT:",
        line.docxLeft,
        "| TOP:",
        line.docxTop,
        "| WIDTH:",
        line.width,
        "| FONT:",
        line.fontSize
    );

});


/* ---------------------------------
   CREATE TEST PARAGRAPHS
--------------------------------- */

const step9Paragraphs =
    step9Lines.map(function (line) {

        return new Paragraph({

            children: [

                new TextRun({

                    text: line.text,

                    size:
                        Math.round(
                            line.fontSize * 2
                        )

                })

            ],

            spacing: {

                before: 0,

                after: 0,

                line: 240

            }

        });

    });


/* ---------------------------------
   CREATE DOCX
--------------------------------- */

const step9Doc =
    new Document({

        sections: [

            {

                properties: {

                    page: {

                        width:
                            Math.round(
                                step9Source.width * 20
                            ),

                        height:
                            Math.round(
                                step9Source.height * 20
                            ),

                        margin: {

                            top: 0,

                            right: 0,

                            bottom: 0,

                            left: 0

                        }

                    }

                },

                children:
                    step9Paragraphs

            }

        ]

    });


/* ---------------------------------
   SAVE MODEL
--------------------------------- */

window.pdfFreeWordStep9 =
    {

        version:
            "STEP-9",

        lineCount:
            step9Lines.length,

        lines:
            step9Lines,

        document:
            step9Doc

    };


/* =================================
   RESULT
================================= */

console.log(
    "DOCX TEST DOCUMENT CREATED"
);

console.log(
    "LINES:",
    step9Lines.length
);

console.log("=================================");
console.log("STEP 9 TEST COMPLETE");
console.log("=================================");




/* =================================
   STEP 10 — ABSOLUTE POSITION TEST
================================= */

const step10Source =
    window.pdfFreeWordDocxPageModel;

console.log("=================================");
console.log("STEP 10 — ABSOLUTE POSITION TEST");
console.log("=================================");


/* ---------------------------------
   TEST LINE
--------------------------------- */

const step10Line =
    step10Source.lines[0];

console.log(
    "TEXT:",
    step10Line.text
);

console.log(
    "LEFT:",
    step10Line.docxLeft
);

console.log(
    "TOP:",
    step10Line.docxTop
);

console.log(
    "FONT SIZE:",
    step10Line.fontSize
);


/* ---------------------------------
   CREATE ABSOLUTE TEXT RUN
--------------------------------- */

const step10TextRun =
    new TextRun({

        text:
            step10Line.text,

        size:
            Math.round(
                step10Line.fontSize * 2
            )

    });


/* ---------------------------------
   CREATE PARAGRAPH
--------------------------------- */

const step10Paragraph =
    new Paragraph({

        children: [

            step10TextRun

        ],

        spacing: {

            before: 0,

            after: 0,

            line: 240

        }

    });


/* ---------------------------------
   CREATE DOCUMENT
--------------------------------- */

const step10Doc =
    new Document({

        sections: [

            {

                properties: {

                    page: {

                        width:
                            Math.round(
                                step10Source.width * 20
                            ),

                        height:
                            Math.round(
                                step10Source.height * 20
                            ),

                        margin: {

                            top: 0,

                            right: 0,

                            bottom: 0,

                            left: 0

                        }

                    }

                },

                children: [

                    step10Paragraph

                ]

            }

        ]

    });


/* ---------------------------------
   SAVE MODEL
--------------------------------- */

window.pdfFreeWordStep10 = {

    version:
        "STEP-10",

    text:
        step10Line.text,

    left:
        step10Line.docxLeft,

    top:
        step10Line.docxTop,

    width:
        step10Line.width,

    fontSize:
        step10Line.fontSize,

    document:
        step10Doc

};


/* =================================
   RESULT
================================= */

console.log(
    "ABSOLUTE POSITION MODEL READY"
);

console.log(
    "LEFT:",
    window.pdfFreeWordStep10.left
);

console.log(
    "TOP:",
    window.pdfFreeWordStep10.top
);

console.log(
    "FONT:",
    window.pdfFreeWordStep10.fontSize
);

console.log("=================================");
console.log("STEP 10 TEST COMPLETE");
console.log("=================================");




/* =================================
   STEP 11A — DOCX POSITIONING API
   DIAGNOSTIC
================================= */

console.log("=================================");
console.log("STEP 11A — DOCX API DIAGNOSTIC");
console.log("=================================");

console.log(
    "DOCX AVAILABLE:",
    !!window.docx
);

console.log(
    "DOCX KEYS:",
    Object.keys(window.docx || {}).sort()
);

console.log(
    "Paragraph:",
    typeof window.docx?.Paragraph
);

console.log(
    "TextRun:",
    typeof window.docx?.TextRun
);

console.log(
    "Frame:",
    typeof window.docx?.Frame
);

console.log(
    "Anchor:",
    typeof window.docx?.Anchor
);

console.log(
    "Position:",
    typeof window.docx?.Position
);

console.log("=================================");
console.log("STEP 11A TEST COMPLETE");
console.log("=================================");




/* =================================
   STEP 11B — CORRECT ABSOLUTE FRAME
================================= */

const step11BSource =
    window.pdfFreeWordDocxPageModel;

const step11BLine =
    step11BSource.lines[0];

console.log("=================================");
console.log("STEP 11B — CORRECT ABSOLUTE FRAME");
console.log("=================================");

console.log(
    "TEXT:",
    step11BLine.text
);

console.log(
    "PDF/DOCX LEFT:",
    step11BLine.docxLeft
);

console.log(
    "PDF/DOCX TOP:",
    step11BLine.docxTop
);

console.log(
    "WIDTH:",
    step11BLine.width
);

console.log(
    "HEIGHT:",
    step11BLine.height
);


/* ---------------------------------
   PDF POINTS → DOCX TWIPS
--------------------------------- */

const step11B_X =
    Math.round(
        step11BLine.docxLeft * 20
    );

const step11B_Y =
    Math.round(
        step11BLine.docxTop * 20
    );

const step11B_W =
    Math.round(
        step11BLine.width * 20
    );

const step11B_H =
    Math.round(
        step11BLine.height * 20
    );


console.log(
    "X TWIPS:",
    step11B_X
);

console.log(
    "Y TWIPS:",
    step11B_Y
);

console.log(
    "WIDTH TWIPS:",
    step11B_W
);

console.log(
    "HEIGHT TWIPS:",
    step11B_H
);


/* ---------------------------------
   ABSOLUTE FRAME
--------------------------------- */

const step11BParagraph =
    new Paragraph({

        children: [

            new TextRun({

                text:
                    step11BLine.text,

                size:
                    Math.round(
                        step11BLine.fontSize * 2
                    )

            })

        ],

        frame: {

            type:
                "absolute",

            position: {

                x:
                    step11B_X,

                y:
                    step11B_Y

            },

            width:
                step11B_W,

            height:
                step11B_H,

            anchor: {

                horizontal:
                    "page",

                vertical:
                    "page"

            },

            wrap:
                "none"

        },

        spacing: {

            before: 0,

            after: 0,

            line: 240

        }

    });


/* ---------------------------------
   CREATE DOCUMENT
--------------------------------- */

const step11BDoc =
    new Document({

        sections: [

            {

                properties: {

                    page: {

                        width:
                            Math.round(
                                step11BSource.width * 20
                            ),

                        height:
                            Math.round(
                                step11BSource.height * 20
                            ),

                        margin: {

                            top: 0,

                            right: 0,

                            bottom: 0,

                            left: 0

                        }

                    }

                },

                children: [

                    step11BParagraph

                ]

            }

        ]

    });


/* ---------------------------------
   SAVE MODEL
--------------------------------- */

window.pdfFreeWordStep11B = {

    version:
        "STEP-11B",

    text:
        step11BLine.text,

    left:
        step11BLine.docxLeft,

    top:
        step11BLine.docxTop,

    width:
        step11BLine.width,

    height:
        step11BLine.height,

    xTwips:
        step11B_X,

    yTwips:
        step11B_Y,

    widthTwips:
        step11B_W,

    heightTwips:
        step11B_H,

    document:
        step11BDoc

};


/* =================================
   RESULT
================================= */

console.log(
    "ABSOLUTE FRAME CREATED"
);

console.log(
    "X:",
    step11B_X
);

console.log(
    "Y:",
    step11B_Y
);

console.log(
    "WIDTH:",
    step11B_W
);

console.log(
    "HEIGHT:",
    step11B_H
);

console.log("=================================");
console.log("STEP 11B TEST COMPLETE");
console.log("=================================");



/* =================================
   STEP 12 + STEP 13
   BLOB → DOWNLOAD
================================= */

console.log("=================================");
console.log("STEP 12 — DOCX BLOB TEST");
console.log("=================================");

const step12Document =
    window.pdfFreeWordStep11B.document;

Packer.toBlob(step12Document)

    .then(function (blob) {

        console.log(
            "DOCX BLOB CREATED:",
            true
        );

        console.log(
            "DOCX BLOB SIZE:",
            blob.size,
            "bytes"
        );

        console.log(
            "DOCX MIME TYPE:",
            blob.type
        );


        /* ---------------------------------
           SAVE BLOB
        --------------------------------- */

        window.pdfFreeWordStep12Blob =
            blob;


        console.log("=================================");
        console.log("STEP 12 TEST COMPLETE");
        console.log("=================================");


        /* =================================
           STEP 13 — DOWNLOAD
        ================================= */

        console.log("=================================");
        console.log("STEP 13 — ACTUAL DOCX DOWNLOAD");
        console.log("=================================");


        const step13Url =
            URL.createObjectURL(blob);


        const step13Link =
            document.createElement("a");


        step13Link.href =
            step13Url;


        step13Link.download =
            "pdf-to-word-step13-test.docx";


        document.body.appendChild(
            step13Link
        );


        step13Link.click();


        step13Link.remove();


        setTimeout(function () {

            URL.revokeObjectURL(
                step13Url
            );

        }, 2000);


        console.log(
            "DOCX DOWNLOAD STARTED"
        );

        console.log(
            "FILE:",
            "pdf-to-word-step13-test.docx"
        );


        console.log("=================================");
        console.log("STEP 13 TEST COMPLETE");
        console.log("=================================");

    })

    .catch(function (error) {

        console.error(
            "STEP 12 DOCX ERROR:",
            error
        );

    });




console.log("🔥🔥 ENTERING STEP 14 🔥🔥");


/* =================================
   STEP 14
   ALL 29 TEXT LINES
   ABSOLUTE DOCX POSITIONING
================================= */

console.log("=================================");
console.log("STEP 14 — ALL TEXT LINES");
console.log("=================================");

const step14Source =
    window.pdfFreeWordDocxPositionModel;

const step14Lines =
    step14Source.lines;

const step14Children = [];

step14Lines.forEach(function (line) {

    const step14X =
        Math.round(line.docxLeft * 20);

    const step14Y =
        Math.round(line.docxTop * 20);

    const step14Width =
        Math.max(
            1,
            Math.round(line.width * 20)
        );

    const step14Height =
        Math.max(
            1,
            Math.round(line.height * 20)
        );

    const step14FontSize =
        Math.max(
            1,
            Math.round(line.fontSize * 2)
        );

    const step14Paragraph =
        new Paragraph({

            children: [
                new TextRun({
                    text: line.text,
                    size: step14FontSize
                })
            ],

            frame: {

                type: "absolute",

                position: {
                    x: step14X,
                    y: step14Y
                },

                width: step14Width,

                height: step14Height,

                anchor: {
                    horizontal: "page",
                    vertical: "page"
                },

                wrap: "none"
            }
        });

    step14Children.push(
        step14Paragraph
    );

    console.log(
        "LINE:",
        line.lineIndex,
        "| TEXT:",
        line.text,
        "| X:",
        line.docxLeft,
        "| TOP:",
        line.docxTop,
        "| FONT:",
        line.fontSize
    );
});


const step14Document =
    new Document({

        sections: [
            {
                properties: {

                    page: {
                        width:
                            Math.round(
                                step14Source.docxPageWidth * 20
                            ),

                        height:
                            Math.round(
                                step14Source.docxPageHeight * 20
                            ),

                        margin: {
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0
                        }
                    }
                },

                children:
                    step14Children
            }
        ]
    });


window.pdfFreeWordStep14 = {

    document:
        step14Document,

    lineCount:
        step14Lines.length

};


console.log(
    "TOTAL TEXT LINES:",
    step14Lines.length
);

console.log(
    "DOCX ABSOLUTE TEXT PARAGRAPHS:",
    step14Children.length
);

console.log(
    "STEP 14 DOCUMENT CREATED:",
    true
);

console.log("=================================");
console.log("STEP 14 TEST COMPLETE");
console.log("=================================");




/* =================================
   STEP 15
   DOWNLOAD 29-LINE DOCX
================================= */

console.log("=================================");
console.log("STEP 15 — 29 LINE DOCX DOWNLOAD");
console.log("=================================");

const step15Document =
    window.pdfFreeWordStep14.document;

Packer.toBlob(step15Document)

    .then(function (blob) {

        console.log(
            "STEP 15 DOCX BLOB CREATED:",
            true
        );

        console.log(
            "STEP 15 DOCX SIZE:",
            blob.size,
            "bytes"
        );

        const step15Url =
            URL.createObjectURL(blob);

        const step15Link =
            document.createElement("a");

        step15Link.href =
            step15Url;

        step15Link.download =
            "pdf-to-word-step15-29-lines.docx";

        document.body.appendChild(
            step15Link
        );

        step15Link.click();

        step15Link.remove();

        setTimeout(function () {

            URL.revokeObjectURL(
                step15Url
            );

        }, 2000);

        console.log(
            "STEP 15 DOCX DOWNLOAD STARTED"
        );

        console.log(
            "FILE:",
            "pdf-to-word-step15-29-lines.docx"
        );

        console.log("=================================");
        console.log("STEP 15 TEST COMPLETE");
        console.log("=================================");

    })

    .catch(function (error) {

        console.error(
            "STEP 15 DOCX ERROR:",
            error
        );

    });


    console.log("🔥🔥 AFTER STEP 15 DIRECT TEST 🔥🔥");




    /* =================================
   STEP 16
   DOCX COORDINATE CALIBRATION
================================= */

console.log("=================================");
console.log("STEP 16 — DOCX COORDINATE CALIBRATION");
console.log("=================================");

const step16Children = [];

const step16TestPositions = [

    {
        name: "TOP LEFT",
        x: 20,
        y: 20
    },

    {
        name: "MIDDLE",
        x: 250,
        y: 350
    },

    {
        name: "BOTTOM RIGHT",
        x: 450,
        y: 700
    }

];

step16TestPositions.forEach(function (item) {

    const step16X =
        Math.round(item.x * 20);

    const step16Y =
        Math.round(item.y * 20);

    console.log(
        "POSITION:",
        item.name,
        "| X:",
        item.x,
        "| Y:",
        item.y,
        "| X TWIPS:",
        step16X,
        "| Y TWIPS:",
        step16Y
    );

    const step16Paragraph =
        new Paragraph({

            children: [

                new TextRun({
                    text:
                        item.name +
                        "  X=" +
                        item.x +
                        "  Y=" +
                        item.y,

                    size: 22
                })

            ],

            frame: {

                position: {
                    x: step16X,
                    y: step16Y
                },

                width: 3000,

                height: 500,

                anchor: {
                    horizontal: "page",
                    vertical: "page"
                },

                wrap: "none"
            }
        });

    step16Children.push(
        step16Paragraph
    );

});


const step16Document =
    new Document({

        sections: [

            {

                properties: {

                    page: {

                        width:
                            Math.round(631 * 20),

                        height:
                            Math.round(816.5 * 20),

                        margin: {

                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0

                        }

                    }

                },

                children:
                    step16Children

            }

        ]

    });


console.log(
    "STEP 16 DOCUMENT CREATED:",
    true
);


console.log("🔥 BEFORE STEP 16 PACKER 🔥");

Packer.toBlob(step16Document)

    .then(function (blob) {

        console.log(
            "STEP 16 BLOB CREATED:",
            true
        );

        console.log(
            "STEP 16 BLOB SIZE:",
            blob.size,
            "bytes"
        );

        const step16Url =
            URL.createObjectURL(blob);

        const step16Link =
            document.createElement("a");

        step16Link.href =
            step16Url;

        step16Link.download =
            "pdf-to-word-step16-coordinate-test.docx";

        document.body.appendChild(
            step16Link
        );

        step16Link.click();

        step16Link.remove();

        setTimeout(function () {

            URL.revokeObjectURL(
                step16Url
            );

        }, 2000);


        console.log(
            "STEP 16 DOWNLOAD STARTED"
        );

        console.log(
            "FILE:",
            "pdf-to-word-step16-coordinate-test.docx"
        );

        console.log("=================================");
        console.log("STEP 16 TEST COMPLETE");
        console.log("=================================");

    })

    .catch(function (error) {

        console.error(
            "STEP 16 ERROR:",
            error
        );

    });



/* =================================
   STEP 17
   DOCX COORDINATE CALIBRATION GRID
================================= */

console.log("=================================");
console.log("STEP 17 — COORDINATE CALIBRATION GRID");
console.log("=================================");

const step17Children = [];

const step17Positions = [

    { name: "X0 Y0",     x: 0,   y: 0 },
    { name: "X100 Y0",   x: 100, y: 0 },
    { name: "X200 Y0",   x: 200, y: 0 },
    { name: "X300 Y0",   x: 300, y: 0 },
    { name: "X400 Y0",   x: 400, y: 0 },
    { name: "X500 Y0",   x: 500, y: 0 },

    { name: "X0 Y100",   x: 0,   y: 100 },
    { name: "X0 Y200",   x: 0,   y: 200 },
    { name: "X0 Y300",   x: 0,   y: 300 },
    { name: "X0 Y400",   x: 0,   y: 400 },
    { name: "X0 Y500",   x: 0,   y: 500 },
    { name: "X0 Y600",   x: 0,   y: 600 },
    { name: "X0 Y700",   x: 0,   y: 700 }

];


step17Positions.forEach(function (item) {

    const step17X =
        Math.round(item.x * 20);

    const step17Y =
        Math.round(item.y * 20);

    console.log(
        "GRID:",
        item.name,
        "| X:",
        item.x,
        "| Y:",
        item.y,
        "| X TWIPS:",
        step17X,
        "| Y TWIPS:",
        step17Y
    );


    const step17Paragraph =
        new Paragraph({

            children: [

                new TextRun({

                    text:
                        item.name,

                    size: 20

                })

            ],

            frame: {

                position: {

                    x: step17X,
                    y: step17Y

                },

                width: 1800,

                height: 400,

                anchor: {

                    horizontal: "page",

                    vertical: "page"

                },

                wrap: "none"

            }

        });


    step17Children.push(
        step17Paragraph
    );

});


const step17Document =
    new Document({

        sections: [

            {

                properties: {

                    page: {

                        width:
                            Math.round(631 * 20),

                        height:
                            Math.round(816.5 * 20),

                        margin: {

                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0

                        }

                    }

                },

                children:
                    step17Children

            }

        ]

    });


console.log(
    "STEP 17 DOCUMENT CREATED:",
    true
);


Packer.toBlob(step17Document)

    .then(function (blob) {

        console.log(
            "STEP 17 BLOB CREATED:",
            true
        );

        console.log(
            "STEP 17 BLOB SIZE:",
            blob.size,
            "bytes"
        );


        const step17Url =
            URL.createObjectURL(blob);


        const step17Link =
            document.createElement("a");


        step17Link.href =
            step17Url;


        step17Link.download =
            "pdf-to-word-step17-calibration-grid.docx";


        document.body.appendChild(
            step17Link
        );


        step17Link.click();


        step17Link.remove();


        setTimeout(function () {

            URL.revokeObjectURL(
                step17Url
            );

        }, 2000);


        console.log(
            "STEP 17 DOWNLOAD STARTED"
        );

        console.log(
            "FILE:",
            "pdf-to-word-step17-calibration-grid.docx"
        );


        console.log("=================================");
        console.log("STEP 17 TEST COMPLETE");
        console.log("=================================");

    })

    .catch(function (error) {

        console.error(
            "STEP 17 ERROR:",
            error
        );

    });






    console.log("=================================");
console.log("STEP 18 ENTRY TEST");
console.log("STEP 18 CODE REACHED");
console.log("=================================");


    /* =================================
   STEP 18 ENTRY TEST
================================= */

console.log("=================================");
console.log("STEP 18 ENTRY TEST");
console.log("STEP 18 CODE REACHED");
console.log("=================================");










/* =================================
   STEP 18
   DOCX GRID CELL POSITION TEST
   NO FRAME X/Y
================================= */

console.log("=================================");
console.log("STEP 18 — DOCX GRID CELL TEST");
console.log("=================================");


/*
   PDF PAGE SIZE
   631 × 816.5
*/

const step18PageWidth = 631;
const step18PageHeight = 816.5;


/*
   5 TEST POSITIONS

   A = TOP LEFT
   B = TOP CENTER
   C = CENTER
   D = BOTTOM LEFT
   E = BOTTOM RIGHT
*/

const step18Tests = [

    {
        text: "A - TOP LEFT",
        x: 20,
        y: 20
    },

    {
        text: "B - TOP CENTER",
        x: 250,
        y: 20
    },

    {
        text: "C - CENTER",
        x: 250,
        y: 380
    },

    {
        text: "D - BOTTOM LEFT",
        x: 20,
        y: 750
    },

    {
        text: "E - BOTTOM RIGHT",
        x: 500,
        y: 750
    }

];


console.log(
    "STEP 18 TEST COUNT:",
    step18Tests.length
);


/*
   GRID SETTINGS

   Small fixed cells.
   Each cell represents a coordinate area.
*/

const step18CellWidth = 10;
const step18CellHeight = 10;


/*
   CONVERT PAGE SIZE
   INTO GRID SIZE
*/

const step18Columns =
    Math.ceil(
        step18PageWidth /
        step18CellWidth
    );

const step18Rows =
    Math.ceil(
        step18PageHeight /
        step18CellHeight
    );


console.log(
    "GRID COLUMNS:",
    step18Columns
);

console.log(
    "GRID ROWS:",
    step18Rows
);


/*
   CREATE GRID
*/

const step18RowsData = [];


for (
    let row = 0;
    row < step18Rows;
    row++
) {

    const step18Cells = [];


    for (
        let col = 0;
        col < step18Columns;
        col++
    ) {

        let cellText = "";


        /*
           Check whether a test label
           belongs inside this cell.
        */

        step18Tests.forEach(function (item) {

            const itemCol =
                Math.floor(
                    item.x /
                    step18CellWidth
                );

            const itemRow =
                Math.floor(
                    item.y /
                    step18CellHeight
                );


            if (
                itemCol === col &&
                itemRow === row
            ) {

                cellText =
                    item.text;

            }

        });


        const step18Paragraph =
            new Paragraph({

                children: [

                    new TextRun({

                        text:
                            cellText,

                        size: 20

                    })

                ],

                spacing: {

                    before: 0,
                    after: 0,
                    line: 240

                }

            });


        step18Cells.push(
            new TableCell({

                children: [
                    step18Paragraph
                ],

                width: {

                    size:
                        Math.round(
                            step18CellWidth * 20
                        ),

                    type:
                        WidthType.DXA

                }

            })

        );

    }


    step18RowsData.push(

        new TableRow({

            children:
                step18Cells

        })

    );

}


/*
   CREATE TABLE
*/

const step18Table =
    new Table({

        rows:
            step18RowsData,

        width: {

            size:
                Math.round(
                    step18PageWidth * 20
                ),

            type:
                WidthType.DXA

        },

        borders: {

            top: {

                style:
                    BorderStyle.NONE,

                size: 0,

                color: "FFFFFF"

            },

            bottom: {

                style:
                    BorderStyle.NONE,

                size: 0,

                color: "FFFFFF"

            },

            left: {

                style:
                    BorderStyle.NONE,

                size: 0,

                color: "FFFFFF"

            },

            right: {

                style:
                    BorderStyle.NONE,

                size: 0,

                color: "FFFFFF"

            },

            insideHorizontal: {

                style:
                    BorderStyle.NONE,

                size: 0,

                color: "FFFFFF"

            },

            insideVertical: {

                style:
                    BorderStyle.NONE,

                size: 0,

                color: "FFFFFF"

            }

        }

    });


/*
   CREATE DOCUMENT
*/

const step18Document =
    new Document({

        sections: [

            {

                properties: {

                    page: {

                        width:
                            Math.round(
                                step18PageWidth * 20
                            ),

                        height:
                            Math.round(
                                step18PageHeight * 20
                            ),

                        margin: {

                            top: 0,

                            right: 0,

                            bottom: 0,

                            left: 0

                        }

                    }

                },

                children: [

                    step18Table

                ]

            }

        ]

    });


console.log(
    "STEP 18 DOCUMENT CREATED:",
    true
);


/*
   CREATE BLOB
*/

Packer.toBlob(step18Document)

    .then(function (blob) {

        console.log(
            "STEP 18 BLOB CREATED:",
            true
        );

        console.log(
            "STEP 18 BLOB SIZE:",
            blob.size,
            "bytes"
        );


        const step18Url =
            URL.createObjectURL(blob);


        const step18Link =
            document.createElement("a");


        step18Link.href =
            step18Url;


        step18Link.download =
            "pdf-to-word-step18-grid-test.docx";


        document.body.appendChild(
            step18Link
        );


        step18Link.click();


        step18Link.remove();


        setTimeout(function () {

            URL.revokeObjectURL(
                step18Url
            );

        }, 2000);


        console.log(
            "STEP 18 DOWNLOAD STARTED"
        );

        console.log(
            "FILE:",
            "pdf-to-word-step18-grid-test.docx"
        );


        console.log("=================================");
        console.log("STEP 18 TEST COMPLETE");
        console.log("=================================");

    })

    .catch(function (error) {

        console.error(
            "STEP 18 ERROR:",
            error
        );

    });






    /* =================================
   STEP 19
   PDF TEXT → GRID POSITION TEST
================================= */

console.log("=================================");
console.log("STEP 19 — PDF TEXT TO GRID TEST");
console.log("=================================");

const step19TextModel =
    window.pdfFreeWordTextModel;

if (!step19TextModel) {

    console.error(
        "STEP 19 ERROR: PDF TEXT MODEL NOT FOUND"
    );

} else {

    console.log(
        "STEP 19 TEXT COUNT:",
        step19TextModel.textCount
    );

    console.log(
        "STEP 19 PAGE:",
        step19TextModel.pageWidth,
        "×",
        step19TextModel.pageHeight
    );


    const step19CellWidth = 10;
    const step19CellHeight = 10;


    const step19Grid = {};


    step19TextModel.items.forEach(function (item) {

        const col =
            Math.floor(
                item.x /
                step19CellWidth
            );

        const row =
            Math.floor(
                item.y /
                step19CellHeight
            );


        const key =
            row + ":" + col;


        if (!step19Grid[key]) {

            step19Grid[key] = [];

        }


        step19Grid[key].push({

            text: item.text,

            x: item.x,

            y: item.y,

            width: item.width,

            height: item.height,

            fontSize: item.fontSize

        });

    });


    console.log(
        "STEP 19 GRID CELLS WITH TEXT:",
        Object.keys(step19Grid).length
    );


    /*
       PRINT FIRST 30 POPULATED CELLS
    */

    let step19Printed = 0;


    Object.keys(step19Grid).forEach(function (key) {

        if (step19Printed >= 30) {

            return;

        }


        console.log(
            "GRID CELL:",
            key,
            step19Grid[key]
        );


        step19Printed++;

    });


    /*
       SAVE MODEL
    */

    window.pdfUniversalPdfTextGrid =
        {

            version: "STEP-19",

            cellWidth:
                step19CellWidth,

            cellHeight:
                step19CellHeight,

            columns:
                Math.ceil(
                    step19TextModel.pageWidth /
                    step19CellWidth
                ),

            rows:
                Math.ceil(
                    step19TextModel.pageHeight /
                    step19CellHeight
                ),

            cells:
                step19Grid

        };


    console.log(
        "STEP 19 MODEL SAVED:",
        true
    );

}


console.log("=================================");
console.log("STEP 19 TEST COMPLETE");
console.log("=================================");








































        /* ================================
           FIRST 10 TEXT ITEMS
        ================================= */

        console.log("---------- FIRST TEXT ITEMS ----------");

        textContent.items
            .slice(0, 10)
            .forEach(function (item, index) {

                console.log(
                    index,
                    "TEXT:",
                    item.str,
                    "X:",
                    item.transform[4],
                    "Y:",
                    item.transform[5]
                );

            });


        console.log("=================================");
        console.log("STEP 1 TEST COMPLETE");
        console.log("=================================");

    } catch (error) {

        console.error("STEP 1 ERROR:", error);

    }

});

console.log("STEP 1 BLOCK CLOSED");

