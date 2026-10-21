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
  const pickupVal = details.pickup?.trim() || details.from || 'Not specified';
  const destVal = details.destination?.trim() || details.to || 'Not specified';

  const isMumbaiToPune = pickupVal.toLowerCase().includes('mumbai') && destVal.toLowerCase().includes('pune');
  const isPuneToMumbai = pickupVal.toLowerCase().includes('pune') && destVal.toLowerCase().includes('mumbai');

  let header = 'Hello, I would like to enquire about booking a cab trip.';
  if (isMumbaiToPune) {
    header = 'Hello, I would like to book a Mumbai to Pune trip.';
  } else if (isPuneToMumbai) {
    header = 'Hello, I would like to book a Pune to Mumbai trip.';
  } else if (pickupVal !== 'Not specified' && destVal !== 'Not specified') {
    header = `Hello, I would like to enquire about a ${pickupVal} to ${destVal} trip.`;
  }

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
  return businessConfig.phone ? `tel:${businessConfig.phone}` : '#';
}
