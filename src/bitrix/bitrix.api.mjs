import axios from "axios";
export class BitrixAPIClient {
    /**
     * Constructs a new BitrixClient instance.
     * @param {string} bitrixWebhookUrl The full webhook URL for your Bitrix instance (e.g., 'https://your-bitrix.bitrix24.eu/rest/1/your_webhook_code/').
     */
    constructor(bitrixWebhookUrl) {
        if (!bitrixWebhookUrl || typeof bitrixWebhookUrl !== 'string') {
            throw new Error('Bitrix Webhook URL is required and must be a string.');
        }
        this.webhookUrl = bitrixWebhookUrl;
        // Configure axios to prevent throwing errors on non-2xx responses immediately,
        // allowing custom error handling.
        this.axiosInstance = axios.create({
            validateStatus: function (status) {
                return status >= 200 && status < 500; // Accept 2xx, 3xx, 4xx statuses
            },
            timeout: 30000, // 30 seconds timeout for requests
        });
    }

    /**
     * Makes a generic call to a Bitrix REST API method.
     * @param {string} method The Bitrix API method to call (e.g., 'crm.lead.add').
     * @param {object} [params={}] An object containing the parameters for the API method.
     * @returns {Promise<object>} A promise that resolves with the API response data or rejects with an error.
     */
    async callMethod(method, params = {}) {
        const url = `${this.webhookUrl}${method}`;
        try {
            console.log(`Calling Bitrix method: ${method} with params:`, params);
            const response = await this.axiosInstance.post(url, params);

            // Bitrix API typically returns a 'result' field on success and 'error' on failure.
            if (response.data && response.data.error) {
                const errorMessage = `Bitrix API Error for method ${method}: ${response.data.error} - ${response.data.error_description}`;
                console.error(errorMessage, response.data);
                throw new Error(errorMessage);
            }

            console.log(`Successfully called Bitrix method: ${method}`);
            return response.data;
        } catch (error) {
            console.error(`Error calling Bitrix method ${method}:`, error.message);
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                console.error('Response headers:', error.response.headers);
            } else if (error.request) {
                // The request was made but no response was received
                console.error('No response received:', error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error message:', error.message);
            }
            throw error; // Re-throw the error for the caller to handle
        }
    }

    /**
     * Creates a single data item in Bitrix (e.g., a CRM lead, contact, or deal).
     * This is a wrapper around `callMethod` for common item creation.
     * @param {string} itemType The type of item to create (e.g., 'crm.lead', 'crm.contact', 'crm.deal', 'crm.item').
     * @param {object} fields An object containing the fields for the new item.
     * @returns {Promise<number>} A promise that resolves with the ID of the newly created item.
     * @throws {Error} If the item creation fails or the response is unexpected.
     */
    async createItem(itemType, fields) {
        let method;
        let params;

        if (itemType === 'crm.item') {
            method = 'crm.item.add';
            // For 'crm.item.add', entityTypeId is a top-level parameter, not inside 'fields'.
            // Extract it from the provided fields object.
            const entityTypeId = fields['ENTITY_TYPE_ID'];
            if (!entityTypeId) {
                throw new Error(`ENTITY_TYPE_ID is required in the fields object for 'crm.item' creation.`);
            }
            // Create a new fields object without ENTITY_TYPE_ID to pass as the 'fields' parameter
            const itemFields = { ...fields };
            delete itemFields['ENTITY_TYPE_ID'];

            params = {
                entityTypeId: entityTypeId,
                fields: itemFields // The remaining fields go into the 'fields' object
            };
        } else {
            method = `${itemType}.add`;
            params = { fields: fields }; // Other CRM entities expect fields nested under a 'fields' key
        }

        try {
            const response = await this.callMethod(method, params);
            if (response && response.result) {
                console.log(`Created ${itemType} with ID: ${response.result}`);
                return response.result; // Bitrix usually returns the ID of the created item in 'result'
            } else {
                throw new Error(`Failed to create ${itemType}. Unexpected response: ${JSON.stringify(response)}`);
            }
        } catch (error) {
            console.error(`Error creating single ${itemType}:`, error.message);
            throw error;
        }
    }


    /**
     * Creates multiple data items in Bitrix by sending them in batches.
     * This is crucial for handling large datasets to avoid API rate limits or timeouts.
     * @param {string} itemType The type of item to create (e.g., 'crm.lead', 'crm.contact', 'crm.deal', 'crm.item').
     * @param {Array<object>} dataItems An array of objects, where each object represents the fields for an item to be created.
     * @param {number} [batchSize=50] The number of items to send in each batch. Bitrix API has limits (e.g., 50 items for `crm.lead.add` batch).
     * @param {number} [delayBetweenBatchesMs=500] The delay in milliseconds between sending each batch to avoid overwhelming the API.
     * @returns {Promise<Array<object>>} A promise that resolves with an array of results for each batch, or rejects with an error.
     * Each result object might contain 'result' (array of IDs) or 'error' information.
     */
    async createLargeDataItems(itemType, dataItems, batchSize = 50, delayBetweenBatchesMs = 500) {
        if (!Array.isArray(dataItems) || dataItems.length === 0) {
            console.warn('No data items provided for creation.');
            return [];
        }

        const totalItems = dataItems.length;
        console.log(`Attempting to create ${totalItems} ${itemType} items in batches of ${batchSize}.`);

        const results = [];

        for (let i = 0; i < totalItems; i += batchSize) {
            const batch = dataItems.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(totalItems / batchSize)} (${batch.length} items)...`);

            const batchPromises = batch.map(item => this.createItem(itemType, item).catch(err => {
                // Catch individual item errors so that one failure doesn't stop the whole batch
                console.error(`Failed to create a single ${itemType} item in batch:`, err.message, 'Item data:', item);
                return { error: err.message, itemData: item }; // Return error info instead of throwing
            }));

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            // Introduce a delay between batches to prevent hitting rate limits
            if (i + batchSize < totalItems) {
                console.log(`Waiting ${delayBetweenBatchesMs}ms before next batch...`);
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatchesMs));
            }
        }

        console.log(`Finished creating ${totalItems} ${itemType} items. Total results: ${results.length}.`);
        return results;
    }
}