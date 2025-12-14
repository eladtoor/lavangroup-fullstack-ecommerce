'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function FloatingWhatsAppButton() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');

  useEffect(() => {
    const fetchWhatsAppDetails = async () => {
      try {
        const docRef = doc(db, 'whatsapp', 'whatsapp-settings');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setPhoneNumber(data.whatsappNumber || '');
          setWhatsappMessage(data.whatsappMessage || '');
        } else {
          console.error('No such document in Firebase!');
        }
      } catch (error) {
        console.error('Error fetching WhatsApp details:', error);
      }
    };

    fetchWhatsAppDetails();
  }, []);

  if (!phoneNumber) return null;

  return (
    <a
      href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`}
      target="_blank"
      rel="noopener noreferrer"
      title="צור קשר עם לבן גרופ בוואטסאפ - שירות מהיר ואישי"
      aria-label="פתח שיחת וואטסאפ עם לבן גרופ"
      className="fixed bottom-5 right-5 bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-4xl shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl z-50"
    >
      <i className="fab fa-whatsapp"></i>
    </a>
  );
}
