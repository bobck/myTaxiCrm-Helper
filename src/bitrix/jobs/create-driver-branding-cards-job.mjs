import {createDriverBrandingCards} from "../modules/create-driver-branding-cards.mjs";

export const job= async () => {
    try {
      const cards= await createDriverBrandingCards();

    } catch (error) {
        console.error('Error occurred in onTick on moveReferralToClosed');
        console.error({ time: new Date(), error });
    }
}