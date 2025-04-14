export async function loadRemonlineOrders() {
  console.log({
    time: new Date(),
    message: 'loadRemonlineOrders',
  });
}

if (process.env.ENV === 'TEST') {
  await remonlineTokenToEnv();
  loadRemonlineOrders();
}
