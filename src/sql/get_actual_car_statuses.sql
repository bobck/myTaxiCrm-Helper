SELECT
    c.license_plate,
    s.event_type,
    ctap.auto_park_id 
FROM
    cars c
LEFT JOIN (
    SELECT
        s_inner.car_id,
        s_inner.event_type
    FROM
        schedule s_inner
    WHERE
        s_inner.event_period_start <= (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Kyiv')::DATE
        AND s_inner.event_period_end >= (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Kyiv')::DATE
        AND s_inner.is_latest_version = TRUE
        AND s_inner.is_deleted = FALSE
) s ON s.car_id = c.id
left join cars_to_auto_parks ctap on c.id=ctap.car_id
WHERE
    ctap.auto_park_id in (
  'eef0dbe4-38f8-4299-95e2-25586bb02a38',
  'b0328dc5-71be-485d-b6ec-786d9ce52112',
  'de4bf8ba-30c2-452c-a688-104063052961',
  '1e8a6a0d-aa34-4d77-a87c-d0c86fab5577',
  '9c8bae55-2aa2-4b25-a1e0-c93ab4bbb3ad',
  '444afd80-52d5-4c87-b02a-c43db8982bef',
  'd34e7c17-ccf3-49d1-875c-67e4378c4562',
  '45dcaa21-bceb-45f2-bba9-5c72bbac441f',
  'be6ab23a-d6ba-4add-b0f7-cfb8abd0586b',
  '21b543d1-a14a-43c6-a719-5becbd25a4e3',
  '052da49c-2175-4033-8010-c8e1f9a755ab',
  '6897e6f0-b33d-405a-b110-8c623c864cfc',
  '2f4c5352-0296-4fba-859b-9f8955f3f2a0',
  'd78cf363-5b82-41b2-8a53-79bb74969ba7',
  '4dd93df2-c172-488c-846f-d81452ddba70',
  '472c4d3e-3fe7-45ea-9c94-a77f364bbd86',
  '34a2020d-d412-461c-ba0a-86e45f9afc78',
  '03328f6b-1336-4ee3-8407-bf5520411136',
  '2964e082-0e86-4695-b5f5-98915d190518',
  'ff2368ca-dce1-4315-af7b-9850056ab3ce',
  'e4df553f-4ec2-43a8-b012-4795259e983a',
  '2bfb0c23-33d8-4bc3-ab03-442d6ba13712',
  '65844e7d-5e8a-4582-9ac3-c8cdaa988726',
  '2d3e566e-01a2-486f-ac7f-446d13f96f27',
  'a7bb17b7-fc87-4617-a915-d2f9ec83cfa0',
  '58ea1e9e-ebdd-4c4d-870c-6ef06e868c60',
  'ee12f8cd-570e-4eab-8ec8-1ead1c619bb7',
  'c6dc6608-1cb3-488d-97f6-3f1132732bb9')
ORDER BY
    c.license_plate ASC;