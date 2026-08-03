import React from 'react';
import { Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { paymentService, PurchaseTarget } from '../services/paymentService';
import { Entitlements } from '../types';
import { handleApiError, showToast } from '../utils/helpers';

/**
 * Drives the mobile checkout flow:
 *   1. ask the backend for a Razorpay Payment Link
 *   2. open it in the system browser
 *   3. once the browser closes, have the backend confirm payment with Razorpay
 *
 * Verification is server-side, so dismissing the browser early simply reports
 * "not completed" rather than granting access.
 */
export const usePurchase = () => {
  const queryClient = useQueryClient();
  const [isPurchasing, setIsPurchasing] = React.useState(false);

  const entitlementsQuery = useQuery<Entitlements>({
    queryKey: ['entitlements'],
    queryFn: paymentService.getEntitlements,
  });

  const hasCourse = React.useCallback(
    (courseId: string) => !!entitlementsQuery.data?.courseIds.includes(courseId),
    [entitlementsQuery.data]
  );

  const hasTestSeries = React.useCallback(
    (testSeriesId: string) => !!entitlementsQuery.data?.testSeriesIds.includes(testSeriesId),
    [entitlementsQuery.data]
  );

  const purchaseMutation = useMutation({
    mutationFn: async (target: PurchaseTarget) => {
      const link = await paymentService.createPaymentLink(target);

      await WebBrowser.openBrowserAsync(link.url, { showTitle: true });

      // The browser has closed — Razorpay is the source of truth on whether it was paid.
      return paymentService.verifyPayment(link.paymentLinkId);
    },
    onSuccess: (result) => {
      if (result.paid) {
        // Every list or detail view whose contents change once access is granted.
        ['entitlements', 'course', 'courses', 'course-library', 'test-series', 'test-series-detail'].forEach(
          (key) => queryClient.invalidateQueries({ queryKey: [key] })
        );
        showToast('success', 'Payment successful', 'You now have full access.');
      } else {
        Alert.alert(
          'Payment not completed',
          'We could not confirm your payment yet. If money has left your account, pull to refresh in a minute or contact support.'
        );
      }
    },
    onError: (error) => showToast('error', 'Checkout failed', handleApiError(error)),
    onSettled: () => setIsPurchasing(false),
  });

  const purchase = React.useCallback(
    (target: PurchaseTarget) => {
      setIsPurchasing(true);
      purchaseMutation.mutate(target);
    },
    [purchaseMutation]
  );

  return {
    entitlements: entitlementsQuery.data,
    isLoadingEntitlements: entitlementsQuery.isLoading,
    refetchEntitlements: entitlementsQuery.refetch,
    hasCourse,
    hasTestSeries,
    purchase,
    isPurchasing,
  };
};
