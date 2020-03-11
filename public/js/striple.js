/* eslint-disable */
import axios from 'axios';
const stripe = Stripe('pk_test_JVWPA1yGAXFfim22BjkHbOhJ00BXP8uvnK');
import { showAlert } from './alert';

export const bookTour = async tourId => {
  try {
    // 1. Get checkout session from API
    const session = await axios({
      method: 'GET',
      url: `/api/v1/bookings/checkout-session/${tourId}`
    });

    // 2. Create checkout form and charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    showAlert('error', err);
  }
};
