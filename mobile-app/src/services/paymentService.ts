import { Entitlements, PaymentLink, PaymentVerification } from '../types';
import apiService from './api';

export type PurchaseTarget = { type: 'course' | 'testSeries'; id: string };

export const paymentService = {
  // What the signed-in student has already paid for
  getEntitlements: async (): Promise<Entitlements> => {
    return apiService.get('/api/payments/entitlements');
  },

  // Create a Razorpay Payment Link to open in the browser
  createPaymentLink: async (target: PurchaseTarget): Promise<PaymentLink> => {
    return apiService.post('/api/payments/link', target);
  },

  // Ask the server to confirm the link was paid and grant access
  verifyPayment: async (paymentLinkId: string): Promise<PaymentVerification> => {
    return apiService.post('/api/payments/verify', { paymentLinkId });
  },
};
