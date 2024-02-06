import fetch from 'node-fetch';

export async function makeCRMRequest({ body }) {
    const retryDelay = 1000;
    const maxRetries = 5;

    for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
        try {
            const response = await fetch(process.env.WEB_API_ENDPOINT, {
                headers: {
                    "content-type": "application/json",
                    authorization: process.env.WEB_API_AUTH,
                },
                method: "POST",
                body: JSON.stringify(body)
            });

            const json = await response.json();

            const { errors, data } = json;

            if (errors) {
                throw errors
            }

            return json;
        } catch (error) {
            console.error(`Attempt ${retryCount + 1} failed. Retrying in ${retryDelay}ms. Error: ${JSON.stringify(error)}`);

            if (retryCount < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retryDelay *= 2;
            } else {
                throw new Error('Max retries reached. Unable to complete the request.');
            }
        }
    }
}

