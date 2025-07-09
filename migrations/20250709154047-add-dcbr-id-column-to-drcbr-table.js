'use strict';

var dbm;
var type;
var seed;

exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async function (db, callback) {
  const rules = [
  {
    id: 'c2017334-a3a8-4d75-b952-e8282315f138',
    driver_id: 'db278ee2-3f3a-4d3d-88fd-12c1295d36be',
  },
  {
    id: 'da52a602-5e2e-4e4e-a634-c297e2ee6e2d',
    driver_id: '6c9ea32d-6137-4be0-891e-6cc80fd55f1c',
  },
  {
    id: 'ae1bc452-3d70-4ac3-be2b-f6d61e580684',
    driver_id: 'c42e9e65-b64f-4996-a516-dd78fb164c66',
  },
  {
    id: '27019682-4a95-4103-b53c-970bc2b0f0cd',
    driver_id: 'c27601b1-a7c8-479f-acbb-5c6d4beb387e',
  },
  {
    id: 'ffeeee5c-0699-49fb-98c1-761f2a217baa',
    driver_id: 'c320124d-bf26-4376-8e43-e3cf73b2df62',
  },
  {
    id: '221ecf51-a30c-4711-8df9-8db7478eb871',
    driver_id: 'dbb7884f-291e-4680-b982-b9f125385bd4',
  },
  {
    id: 'f36925e7-c889-4415-8311-33e890cf74de',
    driver_id: '12b3d972-cc2a-448a-9a8f-91cc0c96da0d',
  },
  {
    id: '06a9d167-0df3-497a-a03f-9bb4695b97c5',
    driver_id: '2eb54304-cabd-4550-bb39-ad43f84b03fc',
  },
  {
    id: 'a62ebf93-e8d9-4982-accf-c28714ff905d',
    driver_id: '1de0a2d0-53af-43e3-a5cd-c3e2804a0633',
  },
  {
    id: 'ed0cf979-249f-4bce-afef-87b23fd3a6c2',
    driver_id: '28cdf175-5e4b-442f-995a-a4b0384d332e',
  },
  {
    id: 'b092c483-36ca-409f-8da9-9d5a8fb62b33',
    driver_id: 'dc7e0f87-9461-40f8-ad08-1bf044fff2b9',
  },
  {
    id: '4544e0f5-ff54-41d9-a388-b6a906a2a5eb',
    driver_id: '05567b94-6c61-447f-b86d-e8b5e07a8df9',
  },
  {
    id: 'e066c1b1-d365-4d9c-939c-7fc521b8f069',
    driver_id: '2d7aecfd-0b31-485e-a620-693c54452278',
  },
  {
    id: '8b7416aa-fc00-4f65-991f-5e77a3afd765',
    driver_id: '3d3586d9-a356-4a20-9e1a-2356ba9a2626',
  },
  {
    id: 'ab9c008f-f14e-406b-83a6-f2f17117af42',
    driver_id: '9ca8f9b7-b00b-4408-a912-daee62b8a790',
  },
  {
    id: 'f440910b-d5cd-43e2-a3de-837907b77c6f',
    driver_id: '06aa978d-26b9-4229-9af9-80b0b6831200',
  },
  {
    id: 'fc757223-2b26-4203-81c1-8cacbfe176bb',
    driver_id: '11035e95-a471-456e-afdb-78adf7bafbb3',
  },
  {
    id: '55608ecf-fc7d-41e9-b966-8c0354235ddc',
    driver_id: '62a83b68-c321-40ab-8767-5bddd4dede55',
  },
  {
    id: '4157a496-a278-453e-b118-c5781f1d8d4d',
    driver_id: '3827c945-1c0d-4b1d-99d7-058c0cb4c8e4',
  },
  {
    id: 'ba70394b-8879-43c9-8989-e09998160a84',
    driver_id: '8021e7fa-f452-4bca-9eb3-774acdeacda6',
  },
  {
    id: '6c23bbaf-a6ba-4813-a9e7-971b25c679ea',
    driver_id: '1fd69cad-3c82-40a6-a3ee-5a4909e6d10e',
  },
  {
    id: '4b6d382a-e6d0-407f-9392-54b99a6fa529',
    driver_id: '96a71cbb-73e8-499c-80bd-477d8497cf41',
  },
  {
    id: '03ba516b-eb7d-4997-91e6-1911501e0985',
    driver_id: '072d715a-6b32-4534-8797-498a69e93ff1',
  },
  {
    id: 'b6e562a4-172f-43c4-8ca7-1f9db8c29451',
    driver_id: '3232f60a-9795-4da0-bb04-5f6601aa9d37',
  },
  {
    id: 'b0aa9043-7ac5-4d2e-b9a8-3e757950dea7',
    driver_id: 'a5daeb99-aa3a-41ae-89a3-8e5b920158fa',
  },
  {
    id: '829cabd8-736a-485f-a82d-92f3f649390b',
    driver_id: '0b770cb6-6b90-4c4e-ab29-939f09767e4f',
  },
  {
    id: '846041aa-d120-47bc-b79d-f65eaf1e1dae',
    driver_id: '514d84b0-23a1-419f-bcf8-bec6cae81fa6',
  },
  {
    id: '8cc6ef50-0922-414a-a6b1-7368a1495971',
    driver_id: 'edde2ede-cedf-410d-91a7-e324b8df2798',
  },
  {
    id: '3bb8d9ee-8b5f-4439-8f0e-e020fc4f3d9b',
    driver_id: '9a048ccf-b9c2-422e-9b97-fe4455de953e',
  },
  {
    id: 'dfb8df2a-30ef-4339-aeb5-e842fbf9923c',
    driver_id: 'd53d5eae-d0c3-4c07-99a6-d7ff39afdfc6',
  },
  {
    id: 'd703b2b6-eab2-4dd8-bcaf-88e2fe262701',
    driver_id: '0d77a929-9e76-4f46-ba6d-9283b104c792',
  },
  {
    id: '72a00909-ee7e-4fdd-a5e9-2e6bc6e7ec02',
    driver_id: '7b068e2a-72bb-43ec-ad7b-3c0299c940bd',
  },
  {
    id: 'd474bcb5-7d65-4daa-8a7b-b2f6d3aa66bf',
    driver_id: 'a0ef3246-b139-4785-b4ff-489cc9859250',
  },
  {
    id: 'a628c6fe-e382-4de0-b198-8661c0c18007',
    driver_id: '1694cde8-1aec-4484-9720-36a28643d123',
  },
  {
    id: 'f4c4d97f-8fd0-43c7-b56d-dc546cfde65e',
    driver_id: 'ac74b41b-a06d-4fa2-a95c-a4740caab3ca',
  },
  {
    id: '34a7cca1-12ab-4668-9ee5-58ec8c7cbac3',
    driver_id: 'ef0896a7-215b-4268-9d52-7455aa683eaf',
  },
  {
    id: '41886fc6-57ca-4ce3-b0c4-ed8c2cfe608d',
    driver_id: '17177913-86b0-4c11-acb8-91747a61c5d0',
  },
  {
    id: 'ddc40b78-6933-40e4-bfc4-ab5c03aae306',
    driver_id: '1efefefb-fbf1-404c-a654-148c3989622c',
  },
  {
    id: 'e9008478-cb02-4867-9dae-845eb379b7cb',
    driver_id: '42fd6662-5955-4e96-add9-c6d3c42aa19c',
  },
  {
    id: '6aea0c1b-ed02-4443-a15e-4d4ff3dd149f',
    driver_id: 'fa668024-81d0-4181-8ebb-d3f6bbfce248',
  },
  {
    id: 'b3a9f97d-4327-4d0d-abd7-0003e46e71b9',
    driver_id: '983e5e9a-6c8b-4274-b4be-467a1566f2ca',
  },
  {
    id: '174530f5-064b-4cd0-8c88-3b118ed09f57',
    driver_id: 'e5a0970b-5914-42ae-a9cb-fe2f3af69ee4',
  },
  {
    id: '6448b2f7-ef1b-4401-a849-b4162445eec7',
    driver_id: 'fedf6b74-12ce-41d3-b8d1-c9d335407491',
  },
  {
    id: '260bd0b6-b4fb-424e-a547-10be425b2cbd',
    driver_id: '1b6cb044-b5b6-4dc1-bb12-f25962532f3f',
  },
  {
    id: 'd757ee5d-5665-4159-8aaa-eef5d282dc8b',
    driver_id: 'feb9b1a9-47b8-4617-a7c9-93ab7dacfe15',
  },
  {
    id: 'a120a7d3-af70-4328-84b1-1e079624d4c1',
    driver_id: '5e5b2654-91a5-4f22-b512-19ad5b3f277a',
  },
  {
    id: '320731ed-8d01-4a49-a0b1-9bda05ceafcf',
    driver_id: 'd030e43a-e7d3-4164-8ecd-056521a4e78a',
  },
  {
    id: '057e2995-f21f-4fd4-899f-7acce7897d18',
    driver_id: '61e37f60-c853-4a14-ad6c-1a30302d8319',
  },
  {
    id: '4bba7c13-724f-43ed-895e-4f4cfc8022b3',
    driver_id: '1f000255-fcbe-4c87-a992-ae8da428d187',
  },
  {
    id: 'd5935341-e8fe-45f1-8be2-d2fe7dff9d36',
    driver_id: '714b5b5a-07ad-4708-9f35-6d0402d8204a',
  },
  {
    id: '7a4d2c73-ea2b-4faf-9311-4e6902b82249',
    driver_id: 'd355a7c2-4037-45db-a380-8facdd17eac5',
  },
  {
    id: 'd98f24bd-fa29-47b7-a4be-9de7f4f832be',
    driver_id: '86c6c30c-ff36-484b-a90f-920c1e37e690',
  },
  {
    id: '2e04ff4c-714b-43a2-a669-809733e01d19',
    driver_id: '3131ae92-4307-4408-87af-290d032cdbf8',
  },
  {
    id: '68c7c0cc-985c-4f8e-b22e-d637ad8d2c70',
    driver_id: '207929c8-0bae-4165-a566-518a7620b65c',
  },
  {
    id: '62f912b0-6ad8-4a05-ad4c-7b407737b1a8',
    driver_id: 'bbc47541-6300-4446-b259-6dc5c1d15480',
  },
  {
    id: '3c9e0328-d438-4d6d-98da-2f59ae4490d8',
    driver_id: '2a0ef3c7-6751-41fb-b098-87714c0acc09',
  },
  {
    id: '32c1ace6-3008-4bc8-950f-d92fe9755536',
    driver_id: 'c5faab79-48f7-483f-9adf-dfa26f40dacb',
  },
  {
    id: 'f42b8d9a-13f5-4c8e-b12d-721fad59e57c',
    driver_id: '2c14a3eb-2316-432f-b5ea-57b495b7538e',
  },
  {
    id: '189d1ab4-6f24-4406-8e59-4367529402cc',
    driver_id: '72433d7a-5333-4c85-ab42-955317f00ee5',
  },
  {
    id: '6488d708-0ff7-419a-9216-ed69e1d4f986',
    driver_id: '35d97fb7-587f-4633-a00c-f89bda344026',
  },
  {
    id: '0f1eb065-aa34-4609-ba1e-273861feaa72',
    driver_id: '36846e94-8a13-4f63-9601-dfcbba387adb',
  },
  {
    id: '0ae8b211-af1d-45b4-9699-260563ce984d',
    driver_id: '38a30f3b-5183-4ae8-8e22-50ab0f2e1180',
  },
  {
    id: '99eed014-65b6-4956-a421-a1c5874c97de',
    driver_id: '390eca8a-6103-4203-a5d0-6e876d8e8d55',
  },
  {
    id: '62671c68-f04e-4bb2-b715-0903da0be5e7',
    driver_id: '3d2f7aa9-c65c-4e0e-81c0-3a4056b8dcfd',
  },
  {
    id: '2bdef4e5-4f3c-4074-8e3f-5f78a1ae93f3',
    driver_id: '444d0a3a-0117-4e40-9e7f-fd1744c5f7e0',
  },
  {
    id: '11e75bca-f5ec-4cd8-a5dc-81a93fb5f638',
    driver_id: '45c928d3-6ccb-4889-aea9-e4220726bb9f',
  },
  {
    id: 'a5421991-cc14-4531-aafc-cdf66dfa6590',
    driver_id: '47011daf-5308-43ac-81da-2ca3b97bec73',
  },
  {
    id: '32b83c52-b5c2-488c-9228-11ad08a3d36b',
    driver_id: '4dedbe24-72be-4e5d-ac5e-82af9bfe8e88',
  },
  {
    id: '4d079a6c-2c2f-4b66-b52c-074b5f7ea810',
    driver_id: '4fc1b4f7-5a91-46d7-8b24-16af7e9de97a',
  },
  {
    id: 'a6f52b5b-659a-48b8-bf32-b70de3da4945',
    driver_id: '522d0e7c-74da-4416-bce5-1d423b379f08',
  },
  {
    id: '3863dd5e-81b2-4a2f-9ab5-1b14d491351b',
    driver_id: '52b43da2-c062-4aa4-aeb7-adf3f4410670',
  },
  {
    id: 'd8d63079-8019-428c-8ce1-0597d5038302',
    driver_id: '53c38c71-1a2a-448a-8599-f197529bc5cc',
  },
  {
    id: '72e56af0-d95c-4970-8c0e-00a1b66dde80',
    driver_id: '5a1de5b5-f98f-4330-8d85-b982f15d3fa8',
  },
  {
    id: '0f0556d4-4b46-40fa-8d3f-96e8f72c660a',
    driver_id: '5db64530-6066-41fb-bd3d-01ae40a03705',
  },
  {
    id: 'bb1d3224-ec12-4974-b9de-a785c5f50fe9',
    driver_id: '60ba3e60-63cf-4b3a-ba33-677515e2fa27',
  },
  {
    id: '755eb6b3-f53a-4b8b-a37f-6195961acf8b',
    driver_id: '63829afa-cb7d-4e90-908e-74d218906d59',
  },
  {
    id: '88a3a116-205f-4fe5-bf68-cd6c8fb026c1',
    driver_id: '658094d7-4f22-4018-a2e7-83f6316dc98d',
  },
  {
    id: 'f1ad318f-8fbc-4a35-972e-880e177a67a6',
    driver_id: '66cbb9b2-8fb5-419c-8df8-647f079f86eb',
  },
  {
    id: '24b00e78-fd37-4e85-9f08-f12c2f910e14',
    driver_id: '6995aa2f-1655-460b-8f19-381a0eefb9b5',
  },
  {
    id: '18e7d31d-9efd-4a38-abb1-8220bd390b36',
    driver_id: '6e356111-095c-4dea-8559-ccf405bb1cc3',
  },
  {
    id: 'ad42ee3e-d6fc-4615-97bf-cc068b2cbb6f',
    driver_id: '6e978044-8a8c-477b-8f66-1d05ee036f95',
  },
  {
    id: 'f1e8ec7d-782b-4a56-890f-14e0f6861298',
    driver_id: '6ea246b8-ad2a-4803-b44c-dadcd7d62bd1',
  },
  {
    id: '618731b8-3748-4a8b-a45e-130133d2c51d',
    driver_id: '72c9a20b-9b64-4e89-bd66-1e31ce8cae0a',
  },
  {
    id: '5821f039-f53b-4eb4-8eb1-35523cc31909',
    driver_id: '6f01fbaa-e1fd-4b1d-a28c-f8b4a300e7bd',
  },
  {
    id: 'd4e352ca-1ff5-4d86-bc03-70878dc2d3c4',
    driver_id: '6fc5745f-562b-4a77-b7c4-0324d43500e7',
  },
  {
    id: '6a125b62-bc16-4dd9-ab00-05dba72d6636',
    driver_id: '76bc089d-15f4-4c3a-92a3-02695645b611',
  },
  {
    id: '2cf3c0b1-a55c-4e95-8d64-fb0f252d240b',
    driver_id: '76e7d7aa-5621-4a09-b014-163925c4b577',
  },
  {
    id: '008ab287-7380-4e22-b3a4-d2b536f4616e',
    driver_id: '7adf0a81-85e6-488e-977e-ac70c74b1763',
  },
  {
    id: '90701698-4c7f-4b7f-ab39-088cea5b6284',
    driver_id: '80eb855e-b896-4c34-b908-eeb37dae051e',
  },
  {
    id: '2183e0f3-772c-4111-80a9-07e4a53056fd',
    driver_id: '810bb2ea-ab7b-4d60-afd5-26bdd9c48a2c',
  },
  {
    id: '43a9930b-aad2-467b-be83-8faa7b2b6570',
    driver_id: '8165b8e7-4669-42d8-9c76-cac382c55cb7',
  },
  {
    id: 'c0c23fba-925e-4d55-96a6-03183f822a6d',
    driver_id: '87a0c6f8-d0df-4306-9be8-46ed78c10540',
  },
  {
    id: '1d51dbda-0102-4f81-a7f0-026ae01455d6',
    driver_id: '884c66e7-61e8-4bea-90f0-4cd8499cf827',
  },
  {
    id: '50b08769-dd69-4b2a-b12b-5524105a1d89',
    driver_id: '8c8e1f4e-1384-45d1-b799-b059d7f31055',
  },
  {
    id: '363c2917-3140-4bee-b7b0-08083ae3a3ae',
    driver_id: '8e8c0adb-b1ab-4810-8562-11c2325a1918',
  },
  {
    id: 'c2cd68bc-dcfd-4d76-951e-d39a83892346',
    driver_id: '985afdd1-6a16-4a24-81dc-a744a247b5b9',
  },
  {
    id: '577c44ee-efa9-4e75-abfa-f5e60fb3af74',
    driver_id: '9ebfb037-5dad-4299-b0a9-f8688874d357',
  },
  {
    id: 'bdeb2d80-c99b-4f5d-988d-b27f3619a163',
    driver_id: 'a0077cb7-751d-4573-93ea-80ab0717cb45',
  },
  {
    id: '83b0ee3d-6388-4e52-8d9d-f29f2c9f633e',
    driver_id: 'a3fb3a9f-2cdc-4022-acb8-e5c40ca3fcab',
  },
  {
    id: 'bfffc98d-2792-4fd2-81f1-11e566d1f6aa',
    driver_id: 'a8d7198b-7ad5-4d13-8155-bbf3641845b5',
  },
  {
    id: 'f4b3eadf-e5f3-4997-85e9-3f0299bd9f94',
    driver_id: 'acfaab0b-9bcb-47ad-88c2-950e8288252b',
  },
  {
    id: '06ae935c-860b-4361-8e94-0c0b6e87a3cf',
    driver_id: 'b02e6b40-d5ef-474e-99aa-4b7ebe7554b5',
  },
  {
    id: 'c7af8eca-fd3e-481f-8ca5-98e2cfadbe36',
    driver_id: 'b105f3ae-6fa5-44a9-852a-80ea42687baf',
  },
  {
    id: 'fee55de4-9f0d-4f2c-b0f3-6d2e3a591929',
    driver_id: 'b9c8e296-81d0-4c5e-a70a-293db245df9e',
  },
  {
    id: 'c4ff60c1-3c7b-400e-9df0-741cad04ffb2',
    driver_id: 'bb4b0ec7-ef7d-438b-aa8f-f45445399940',
  },
  {
    id: 'ebd84ef1-f8be-499c-af7f-ad67fbc4729b',
    driver_id: 'bd896c94-44e6-4a96-ad40-9629e5cadb34',
  },
  {
    id: 'c72b1193-1d14-4e6c-849b-80fa71022a6d',
    driver_id: 'bda49d91-9ab3-4d0c-8e14-97679b5e637b',
  },
  {
    id: '4fd47b28-f0df-42a3-9edd-952bd3c72287',
    driver_id: 'bed59fa1-d6a5-4d38-9a10-d468d042e953',
  },
  {
    id: 'eb8160d0-d271-46cf-b460-5f99d889526d',
    driver_id: 'c226dbc7-0f12-428d-9f44-0eae97a2f706',
  },
  {
    id: '4cf20db7-d69a-41a9-b8a9-83ebe14f592a',
    driver_id: 'c3937f41-5917-4b95-8abb-63a34b6eea70',
  },
  {
    id: 'b9ad0610-7746-450c-a8cb-cbd391cd95a6',
    driver_id: 'cdf8a436-360e-4545-bc4b-cc37d0d3530b',
  },
  {
    id: '88c18836-90e5-448a-b6c8-ef961d52a61f',
    driver_id: 'd05ba4a4-92ce-4693-882e-326c27731f48',
  },
  {
    id: '7c9d7253-3dc4-40f5-b467-b3432c548f69',
    driver_id: 'd2fb16ca-0a0e-4f6e-9d9b-f1b326178ca6',
  },
  {
    id: '1985f1d8-e41c-4cb7-b8ed-7cd8a7019c0e',
    driver_id: 'd334a034-f826-4682-90e3-a1d7d38818e9',
  },
  {
    id: '4c574d8c-4db0-4987-b6dc-c6bc348d8360',
    driver_id: 'd34de45e-8f8b-41ef-83c2-b28afa19de61',
  },
  {
    id: 'c02107e6-c932-49c5-9772-a3e6963ec24a',
    driver_id: 'db2a4163-5735-48e9-a019-1f051799c451',
  },
  {
    id: '03d7d4c0-6500-43a4-a4a9-4a0f54c9f166',
    driver_id: 'e0f3317c-260c-4b79-ac9c-a04d0a1ca9dd',
  },
  {
    id: '6b97b446-6423-4e08-93d6-00e3379c5f59',
    driver_id: 'e192e67d-2478-4483-885b-43fa0f594298',
  },
  {
    id: 'f4027f15-5f0d-4941-a3e8-f2d857d678e1',
    driver_id: 'e66c1cbb-c3c0-4210-8544-bb30a73d455c',
  },
  {
    id: '3289af27-3776-45b2-9643-0f5ee4f8150e',
    driver_id: 'e80e36f6-383a-4924-8569-ccb850c36176',
  },
  {
    id: 'f656a45c-2a47-4865-af26-c155b18eeef9',
    driver_id: 'ec8a2757-fc0b-4e1d-9101-32d3ec288e26',
  },
  {
    id: '0270c536-0ed2-400d-93a8-c2c40d3ddec8',
    driver_id: 'f0a47a1d-eba4-43b0-9762-120bb2de55da',
  },
  {
    id: 'eeb66a4e-fcad-4c1d-a402-640044d45ee8',
    driver_id: 'f1ba674f-c124-4d1f-b01c-535383cb187e',
  },
  {
    id: 'ea870ac3-b39d-4674-99a2-cbbdfd97824e',
    driver_id: 'f5a819ca-9339-4284-9ed5-9471363f36e8',
  },
  {
    id: '93887663-2b2d-4ba5-af07-4202c040facc',
    driver_id: 'f86e4fcf-0ada-4a40-bd61-5937d32a7525',
  },
  {
    id: '82512776-7176-4867-b268-a824d0405e8b',
    driver_id: 'fbdf38bd-2c21-464f-b3b3-865676930ebc',
  },
  {
    id: '01d80fbf-0459-4cef-a6e1-03f8df380329',
    driver_id: 'ff5283fc-1eb6-4f79-9a09-c0e51eea3a9a',
  },
  {
    id: 'd0a391df-fe48-41cf-acc0-fa3ad5ac6bbf',
    driver_id: 'ff5c0d5d-4004-4067-991f-a15d3db97f2a',
  },
  {
    id: '7e7e8382-5426-426c-ba85-82a98bbb1b2f',
    driver_id: '4a7733ca-7ce8-4629-821f-3a76d0db5313',
  },
  {
    id: 'eba59f50-52e4-44c7-8f75-3513e0ab3176',
    driver_id: '5552d030-1ac7-43ca-9fd2-c7fda7c6f2df',
  },
  {
    id: '301a4fb4-5a87-4903-9841-dfd3487ebabf',
    driver_id: '95562abc-2d59-4348-a2f4-dfe8f238a6b9',
  },
];

  const sql = `ALTER TABLE driver_cash_block_rules ADD COLUMN driver_cash_block_rule_id TEXT NOT NULL DEFAULT '';`;
  await db.runSql(sql, callback);
  const updateSql = `
    UPDATE driver_cash_block_rules
    SET driver_cash_block_rule_id = CASE driver_id
      ${rules.map(rule => `WHEN '${rule.driver_id}' THEN '${rule.id}'`).join('\n      ')}
      ELSE driver_cash_block_rule_id -- Keep existing value if no match
    END
    WHERE driver_id IN (${rules.map(rule => `'${rule.driver_id}'`).join(', ')});
  `;

  await db.runSql(updateSql);
};

exports.down = function (db, callback) {
  const sql = `ALTER TABLE driver_cash_block_rules DROP COLUMN driver_cash_block_rule_id;`;
  db.runSql(sql, callback);
};

exports._meta = {
  version: 1,
};
