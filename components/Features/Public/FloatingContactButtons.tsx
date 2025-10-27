import React from 'react';
import { FiMail } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

interface FloatingContactButtonsProps {
  whatsapp?: string | null;
  email?: string | null;
}

const FloatingContactButtons: React.FC<FloatingContactButtonsProps> = ({ whatsapp, email }) => {
  const cleanWhatsapp = whatsapp?.replace(/\D/g, '');

  if (!cleanWhatsapp && !email) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      {cleanWhatsapp && (
        <a
          href={`https://wa.me/${cleanWhatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contact us on WhatsApp"
          title="Fale conosco no WhatsApp"
          className="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-transform hover:scale-110"
        >
          <FaWhatsapp size={28} />
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          aria-label="Send us an email"
          title="Envie-nos um e-mail"
          className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-transform hover:scale-110"
        >
          <FiMail size={24} />
        </a>
      )}
    </div>
  );
};

export default FloatingContactButtons;
