import React from 'react';
import { capitalizeWords } from '../utils';

interface InfoPanelProps {
  layerName: string | null;
  imageUrls?: string[];
}

const InfoPanel: React.FC<InfoPanelProps> = ({ layerName, imageUrls }) => {
  const hasContent = layerName && imageUrls && imageUrls.length > 0;

  return (
    <div
      className={`
        absolute top-1/2 right-4 -translate-y-1/2
        w-80 h-auto bg-black/60 backdrop-blur-md rounded-lg shadow-2xl
        p-4 text-white
        transition-all duration-300 ease-in-out
        hidden md:flex flex-col gap-3
        ${hasContent ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'}
      `}
      style={{ zIndex: 1500 }}
      aria-hidden={!hasContent}
    >
      {hasContent && (
        <>
          <h3 
            className="text-lg font-bold"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            {capitalizeWords(layerName)}
          </h3>
          <div className="flex flex-col gap-3 max-h-[calc(100vh-200px)] overflow-y-auto">
            {imageUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`${capitalizeWords(layerName)} image ${index + 1}`}
                className="w-full h-auto object-cover rounded-md"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default InfoPanel;
