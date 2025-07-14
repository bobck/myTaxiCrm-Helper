import axios from 'axios';
import { devLog } from '../shared/shared.utils.mjs';
import { getDefaultResultOrder } from 'dns';
export class BitrixAPIClient {
  constructor(bitrixWebhookUrl) {
    if (!bitrixWebhookUrl || typeof bitrixWebhookUrl !== 'string') {
      throw new Error('Bitrix Webhook URL is required and must be a string.');
    }
    this.webhookUrl = bitrixWebhookUrl;
    this.axiosInstance = axios.create({
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      },
      timeout: 30000,
    });
  }

  async batch({ batchObj, halt }) {
    // devLog({ batchObj, halt });
    devLog(batchObj);
    // return
    const url = `${this.webhookUrl}batch`;
    const cmd = {};
    for (const id in batchObj) {
      const { method, params } = batchObj[id];
      let command = `${method}?`;
      for (const param in params) {
        command += `${param}=${params[param]}&`;
      }
      command = command.slice(0, -1);
      cmd[id] = command;
    }
    const body = {
      halt: halt ?? 0,
      cmd,
    };
    devLog({ url, body });
    const response = await this.axiosInstance.post(url, body);
    const { data } = response;
    const { result: resuletGethered } = data;
    console.log(resuletGethered);
    return resuletGethered;
  }
}
