WITH
  dtp_debt_top_ups AS (
    SELECT
      ct.created_at,
      ct.auto_park_id,
      ct.driver_id,
      ct.purpose,
      ct.sum,
      ct.human_id,
      CONCAT(u.first_name, ' ', u.last_name) added_by_user_name,
      CASE
        WHEN ct."comment" LIKE '%https://taxify.bitrix24.eu/crm/deal/details/%' THEN (
        SELECT regexp_replace(
            substring(ct."comment" from '/details/([0-9]+)/'),
            '/details/',
            ''
        )
    )
        ELSE NULL
      END AS dtp_deal_id
    FROM
      cashbox_transactions ct
      LEFT JOIN users u ON u.id = ct.added_by_user_id
    WHERE
      ct.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
		AND ct.purpose in ('TOP_UP_DEBT','FORCED_PAY_OFF_DEBT','VOLUNTARY_PAY_OFF_DEBT','PAY_OFF_DEBT_DEPOSIT_ACCOUNT')
      AND ct.created_at > $1
  )
SELECT
		ct.auto_park_id ,
		ct.driver_id ,
		ct.human_id,
    ct.purpose,
		ct.sum,
		ct.added_by_user_name,
		ct.dtp_deal_id,
		ct.created_at
FROM
  dtp_debt_top_ups ct
WHERE
  ct.dtp_deal_id IS NOT NULL
