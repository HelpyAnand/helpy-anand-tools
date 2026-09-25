export default async function handler(req, res) {

    try {

        console.log("=================================");
        console.log("CLOUDCONVERT PDF → DOCX");
        console.log("=================================");


        // ---------------------------------
        // METHOD CHECK
        // ---------------------------------

        if (req.method !== "POST") {

            return res.status(405).json({

                success: false,

                message:
                    "Only POST method is allowed"

            });

        }


        // ---------------------------------
        // API KEY
        // ---------------------------------

        const apiKey =
            process.env.CLOUDCONVERT_API_KEY;


        if (!apiKey) {

            return res.status(500).json({

                success: false,

                message:
                    "CLOUDCONVERT_API_KEY is not configured"

            });

        }


        // ---------------------------------
        // REQUEST BODY
        // ---------------------------------

        const body = req.body || {};

        const fileBase64 =
            body.fileBase64;

        const fileName =
            body.fileName ||
            "input.pdf";


        if (!fileBase64) {

            return res.status(400).json({

                success: false,

                message:
                    "PDF file data is missing"

            });

        }


        console.log(
            "FILE NAME:",
            fileName
        );

        console.log(
            "BASE64 LENGTH:",
            fileBase64.length
        );


        // ---------------------------------
        // REMOVE DATA URL PREFIX
        // ---------------------------------

        const cleanBase64 =
            String(fileBase64)
                .replace(
                    /^data:application\/pdf;base64,/i,
                    ""
                );


        // ---------------------------------
        // CREATE CLOUDCONVERT JOB
        // ---------------------------------

        const jobPayload = {

            tasks: {

                "import-pdf": {

                    operation:
                        "import/base64",

                    file:
                        cleanBase64,

                    filename:
                        fileName

                },


                "convert-pdf-to-docx": {

                    operation:
                        "convert",

                    input:
                        "import-pdf",

                    input_format:
                        "pdf",

                    output_format:
                        "docx"

                },


                "export-docx": {

                    operation:
                        "export/url",

                    input:
                        "convert-pdf-to-docx"

                }

            },

            redirect: true

        };


        console.log(
            "CREATING CLOUDCONVERT JOB..."
        );


        // ---------------------------------
        // CLOUDCONVERT SYNC JOB
        // ---------------------------------

        const cloudResponse =
            await fetch(
                "https://sync.api.cloudconvert.com/v2/jobs",
                {

                    method: "POST",

                    headers: {

                        "Authorization":
                            `Bearer ${apiKey}`,

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            jobPayload
                        )

                }
            );


        console.log(
            "CLOUDCONVERT STATUS:",
            cloudResponse.status
        );


        // ---------------------------------
        // CHECK RESPONSE
        // ---------------------------------

        if (!cloudResponse.ok) {

            const errorText =
                await cloudResponse.text();


            console.error(
                "CLOUDCONVERT ERROR:",
                errorText
            );


            return res.status(
                cloudResponse.status
            ).json({

                success: false,

                message:
                    "CloudConvert conversion failed",

                details:
                    errorText

            });

        }


        // ---------------------------------
        // FETCH OUTPUT FILE
        // ---------------------------------

        console.log(
            "DOWNLOADING GENERATED DOCX..."
        );


        const docxResponse =
            await fetch(
                cloudResponse.url
            );


        if (!docxResponse.ok) {

            const errorText =
                await docxResponse.text();


            console.error(
                "DOCX DOWNLOAD ERROR:",
                errorText
            );


            return res.status(500).json({

                success: false,

                message:
                    "Could not download generated DOCX"

            });

        }


        const docxBuffer =
            Buffer.from(
                await docxResponse.arrayBuffer()
            );


        console.log(
            "DOCX SIZE:",
            docxBuffer.length,
            "bytes"
        );


        // ---------------------------------
        // OUTPUT HEADERS
        // ---------------------------------

        const outputFileName =
            fileName
                .replace(
                    /\.pdf$/i,
                    ""
                ) +
            ".docx";


        res.setHeader(

            "Content-Type",

            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

        );


        res.setHeader(

            "Content-Disposition",

            `attachment; filename="${outputFileName}"`

        );


        res.setHeader(

            "Content-Length",

            docxBuffer.length

        );


        // ---------------------------------
        // SEND DOCX
        // ---------------------------------

        return res.status(200).send(
            docxBuffer
        );


    } catch (error) {

        console.error(
            "================================="
        );

        console.error(
            "PDF → DOCX ERROR:"
        );

        console.error(
            error
        );

        console.error(
            "================================="
        );


        return res.status(500).json({

            success: false,

            message:
                "Server error during PDF to DOCX conversion"

        });

    }

}