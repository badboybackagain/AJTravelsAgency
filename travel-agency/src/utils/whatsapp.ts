import { businessConfig } from '../config/business.config';

export interface BookingDetails {
  from: string;
  to: string;
  pickup: string;
  destination: string;
  date: string;
  time: string;
  passengers: string;
  tripType: string;
  vehicle: string;
}

export function generateWhatsAppMessage(details: Partial<BookingDetails>): string {
  const isMumbaiToPune = details.from === 'Mumbai' || (details.pickup && details.pickup.toLowerCase().includes('mumbai'));
  
  const header = isMumbaiToPune
    ? 'Hello, I would like to book a Mumbai to Pune trip.'
    : 'Hello, I would like to book a Pune to Mumbai trip.';

  const pickupVal = details.pickup?.trim() || details.from || 'Not specified';
  const destVal = details.destination?.trim() || details.to || 'Not specified';
  const dateVal = details.date || 'As soon as possible';
  const timeVal = details.time || 'Flexible';
  const passVal = details.passengers || '1-4';
  const tripVal = details.tripType || 'One Way';
  const vehicleVal = details.vehicle || 'Any Available';

  const message = `${header}

Pickup: ${pickupVal}
Destination: ${destVal}
Date: ${dateVal}
Time: ${timeVal}
Passengers: ${passVal}
Trip Type: ${tripVal}
Vehicle: ${vehicleVal}

Please share current vehicle availability and fare.`;

  return message;
}

export function getWhatsAppLink(details: Partial<BookingDetails>): string {
  const message = generateWhatsAppMessage(details);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${businessConfig.whatsapp}?text=${encoded}`;
}

export function getPhoneCallLink(): string {
  return `tel:${businessConfig.phone}`;
}
