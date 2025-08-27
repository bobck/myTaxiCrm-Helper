export const synchronizeDriversIgnoringDCBR = async () => {
  console.log({
    message: 'synchronizeDriversIgnoringDCBR',
    date: new Date()
  });



  
}


if(process.env.ENV == 'TEST') {
  synchronizeDriversIgnoringDCBR();
}

