export const sendWhatsAppMessage = (phoneNumber: string, message: string) => {
  const formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

  if (typeof window !== 'undefined') {
    window.open(whatsappUrl, '_blank');
  }
};

export const getDefaultWhatsAppNumber = () => {
  // You can configure this in environment variables
  return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '972500000000';
};
