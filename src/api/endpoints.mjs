

import express from 'express'
import { DateTime } from "luxon";
import { referralValidadion } from '../bitrix/modules/referral-validation.mjs';
import { referralTypeId } from '../bitrix/bitrix.constants.mjs';
import {
    saveRecruitDeal,
    saveReferralIdForRecruitDeal,
    approvalReferralById
} from '../bitrix/bitrix.queries.mjs';
import {
    completeBitrixTaskById,
    addCommentToEntity
} from '../bitrix/bitrix.utils.mjs';

export async function initApi({ pool }) {
    const app = express()
    app.use(express.json());

    app.post('/query', async function (req, res) {
        const { body } = req
        const { sql } = body

        if (!sql) {
            return res.status(400).json({
                error: 'POST: query',
                message: 'sql is required'
            });
        }

        try {
            const result = await pool.query(sql)
            const { rows } = result
            return res.status(200).json(rows);
        } catch (err) {
            return res.status(404).json(err);
        }
    })

    app.post('/referral-validation', async (req, res) => {
        const { query } = req;
        const {
            task_id,
            doc_id,
            first_name,
            last_name,
            contract,
            deal_id,
            contact_id,
            assigned_by_id,
            city_id
        } = query;

        console.log({ message: 'POST: referral-validation', query })

        const isValid = await referralValidadion({
            task_id,
            doc_id,
            first_name,
            last_name,
            contract,
            deal_id,
            contact_id,
            assigned_by_id,
            city_id
        });

        if (!isValid) {
            return res.status(400).json({ status: 'error' });
        }

        const { auto_park_id, id } = isValid
        try {
            const expiryAfter = DateTime.now().plus({ days: 31 }).toFormat("yyyy-MM-dd HH:mm:ss");

            await saveRecruitDeal({
                task_id,
                doc_id,
                first_name,
                last_name,
                contract,
                deal_id,
                auto_park_id,
                driver_id: id,
                expiry_after: expiryAfter,
                contact_id,
                assigned_by_id,
                city_id
            });

            await completeBitrixTaskById({ task_id });

        } catch (e) {
            console.error({ deal_id, message: 'Unable to complete Bitrix Task', e })
            return res.status(400).json({ status: 'error' });
        }

        return res.status(200).json({ status: 'ok' });
    });

    app.post('/referral-add', async (req, res) => {
        const { query } = req;
        const {
            referral_id,
            deal_id,
            task_id
        } = query;

        console.log({ message: 'POST: referral-add', query })

        await saveReferralIdForRecruitDeal({
            deal_id,
            referral_id,
            task_id
        });

        return res.status(200).json({ status: 'ok' });
    });

    app.post('/referral-approval', async (req, res) => {
        const { query } = req;
        const {
            referral_id,
            referrer_phone,
            referrer_name,
            referrer_position
        } = query;

        console.log({ message: 'POST: referral-approval', query })

        //TODO: move to module and pass crm link to referral card. Add validation if not exist
        await approvalReferralById({
            referral_id,
            referrer_phone,
            referrer_name,
            referrer_position
        });

        const comment = `Реферал успішно додано до програми`

        await addCommentToEntity({
            entityId: referral_id,
            typeId: referralTypeId,
            comment
        });

        return res.status(200).json({ status: 'ok' });
    });

    app.listen(3000)

    console.log({
        message: 'Express listening',
        time: new Date()
    })

}
