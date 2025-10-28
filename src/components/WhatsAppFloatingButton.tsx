import { MessageCircle } from "lucide-react";
import whatsappHelper from "@/assets/whatsapp-helper.png";

const WhatsAppFloatingButton = () => {
  const handleWhatsAppClick = () => {
    // Replace with your WhatsApp number (format: country code + number without + or spaces)
    const phoneNumber = "5215512345678"; // Example: Mexico number
    const message = encodeURIComponent("Hola! Necesito ayuda con Chamby");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 z-50 group hover:scale-110 transition-transform duration-300"
      aria-label="Ayuda por WhatsApp"
    >
      {/* Character container with WhatsApp badge */}
      <div className="relative">
        {/* Character */}
        <img 
          src={whatsappHelper} 
          alt="Ayuda Chamby" 
          className="w-20 h-20 drop-shadow-lg"
        />
        
        {/* WhatsApp Icon Badge */}
        <div className="absolute -bottom-1 -right-1 bg-[#25D366] rounded-full p-2 shadow-lg group-hover:scale-110 transition-transform">
          <MessageCircle className="w-5 h-5 text-white" fill="white" />
        </div>
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
          ¿Necesitas ayuda?
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </button>
  );
};

export default WhatsAppFloatingButton;
