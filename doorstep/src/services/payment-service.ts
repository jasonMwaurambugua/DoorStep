import { PaymentIntent } from 'stripe';
import { Stripe } from 'stripe';

export class PaymentService {
    private stripe: Stripe;

    constructor(apiKey: string) {
        this.stripe = new Stripe(apiKey, {
            apiVersion: '2020-08-27',
        });
    }

    async createPaymentIntent(amount: number, currency: string): Promise<PaymentIntent> {
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount,
            currency,
        });
        return paymentIntent;
    }

    async confirmPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
        const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
        return paymentIntent;
    }

    async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
        return paymentIntent;
    }
}