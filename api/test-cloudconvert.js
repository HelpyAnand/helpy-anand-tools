export default async function handler(req, res) {

    try {

        // ---------------------------------
        // METHOD CHECK
        // ---------------------------------

        if (req.method !== "GET") {

            return res.status(405).json({
                success: false,
                message: "Method not allowed"
            });

        }


        // ---------------------------------
        // API KEY CHECK
        // ---------------------------------

        const apiKey =
            process.env.CLOUDCONVERT_API_KEY;


        if (!apiKey) {

            return res.status(500).json({

                success: false,

                message:
                    "CLOUDCONVERT_API_KEY is not configured in Vercel"

            });

        }


        // ---------------------------------
        // CLOUDCONVERT API TEST
        // ---------------------------------

        const response =
            await fetch(
                "https://api.cloudconvert.com/v2/users/me",
                {

                    method: "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${apiKey}`,

                        "Content-Type":
                            "application/json"

                    }

                }
            );


        const data =
            await response.json();


        // ---------------------------------
        // API RESPONSE
        // ---------------------------------

        if (!response.ok) {

            console.error(
                "CloudConvert API Error:",
                data
            );

            return res.status(
                response.status
            ).json({

                success: false,

                message:
                    "CloudConvert API authentication failed",

                cloudConvert:
                    data

            });

        }


        // ---------------------------------
        // SUCCESS
        // ---------------------------------

        return res.status(200).json({

            success: true,

            message:
                "CloudConvert API connection successful",

            account:
                data.data || null

        });


    } catch (error) {

        console.error(
            "CloudConvert Test Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Server error while connecting to CloudConvert"

        });

    }

}