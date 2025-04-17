import { initApi } from './src/api/endpoints.mjs';
import { telegramJobs } from './src/telegram/bootstrap.mjs';
import { openSShTunnel } from './ssh.mjs';
import { sheetJobs } from './src/sheets/bootstrap.mjs';
import { remonlineJobs } from './src/remonline/bootstrap.mjs';
import { remonlineTokenToEnv } from './src/remonline/remonline.api.mjs';
import { bqJobs } from './src/bq/bootstrap.mjs';
import { driversCustomTariffJobs } from './src/web.api/bootstrap.mjs';
import { pool } from './src/api/pool.mjs';
import { bitrixJobs } from './src/bitrix/bootstrap.mjs';

await openSShTunnel;

await initApi({ pool });
// telegramJobs();
// sheetJobs();
bqJobs();

await remonlineTokenToEnv();
remonlineJobs();

driversCustomTariffJobs();
bitrixJobs();
const a={
    "id": 52943144,
    "modified_at": 1744892360000,
    "uuid": "97793012-966e-4a3c-a520-d5ce5ed38a75",
    "status": {
      "id": 1342661,
      "name": "В роботі СТО",
      "color": "#5CB85C",
      "group": 2
    },
    "created_at": 1744891368000,
    "scheduled_for": 1744891200000,
    "duration": 60,
    "kindof_good": "",
    "serial": "",
    "packagelist": "",
    "appearance": "",
    "malfunction": "Шиномонтаж",
    "manager_notes": "",
    "engineer_notes": "",
    "resume": "",
    "payed": 0,
    "missed_payments": 0,
    "warranty_measures": 0,
    "urgent": false,
    "discount_sum": 350,
    "resources": [
      {
        "id": 104255,
        "name": "03 Підйомник 3"
      }
    ],
    "custom_fields": {
      "f5294177": "19_Зовнішній Клієнт СТО G CAR (Рівне)",
      "f5294178": 18708
    },
    "estimated_cost": "0",
    "estimated_done_at": 1744977660000,
    "id_label": "SID_RVK_17-04-2025-003228",
    "price": 400,
    "branch_id": 154905,
    "overdue": false,
    "status_overdue": false,
    "parts": [],
    "operations": [
      {
        "id": 78131997,
        "entityId": 37114487,
        "uom": {
          "id": 1,
          "description": "Pieces",
          "title": "pcs"
        },
        "engineerId": 276095,
        "title": "Шиномонтаж - комплекс",
        "amount": 1,
        "price": 400,
        "cost": 0,
        "discount_value": 350,
        "taxes": [],
        "warranty": 2,
        "warranty_period": 0
      }
    ],
    "attachments": [],
    "order_type": {
      "id": 218275,
      "name": "В-СТО - Зовнішній клієнт"
    },
    "client": {
      "id": 34239548,
      "name": "Юрій Калина",
      "first_name": "Юрій",
      "last_name": "Калина",
      "email": "",
      "phone": [
        "380675767236"
      ],
      "notes": "",
      "address": "Рівне",
      "supplier": false,
      "juridical": false,
      "conflicted": false,
      "modified_at": 1744873159000,
      "created_at": 1744873159000,
      "discount_code": "",
      "discount_goods": 0,
      "order_discount_services": 0,
      "sale_discount_services": 0,
      "discount_materials": 0,
      "custom_fields": {
        "f5370833": "Зовнішній клієнт",
        "f6729251": "",
        "f6729300": "",
        "f6879276": "Рівне"
      },
      "ad_campaign": {
        "id": 301122,
        "name": "Зовнішня реклама"
      }
    },
    "manager_id": 237560,
    "engineer_id": 276095,
    "created_by_id": 237560,
    "ad_campaign": {
      "id": 492767,
      "name": "СЕЗОН - РІВНЕ - 2025"
    },
    "asset": {
      "id": 6094288,
      "uid": "BK3092YA",
      "title": "Зовнішній клієнт G_CAR SERVICE BYD E-2",
      "color": "Білий",
      "state": "",
      "cost": 0,
      "group": "Зовнішній клієнт G_CAR SERVICE",
      "brand": "BYD",
      "model": "E-2",
      "modification": "",
      "year": "2022",
      "owner": {
        "id": 34239548,
        "name": "Юрій Калина"
      },
      "warehouse": {
        "title": "Client > Юрій Калина > Комірка 1",
        "id": 4131336,
        "cell_id": 4164830,
        "client_id": 34239548
      },
      "group_icon": "i-asset0",
      "f3369990": 25000,
      "f3369991": "LC0CE4DC5N0112008",
      "f7280143": "0",
      "f8088870": 0,
      "f8150953": "",
      "f8150954": "",
      "f8150955": "",
      "f8158976": ""
    },
    "brand": "BYD",
    "model": "E-2"
  }