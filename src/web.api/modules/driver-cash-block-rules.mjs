import {openSShTunnel} from '../../../ssh.mjs';


export const driverCashBlockRules = async()=>{
    console.log('driverCashBlockRules');
}

if(process.env.ENV='TEST'){
    await openSShTunnel;
    await driverCashBlockRules();
}