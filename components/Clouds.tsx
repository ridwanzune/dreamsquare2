import React, { useMemo } from 'react';
import { CLOUDS_CONFIG } from '../constants';

const Clouds: React.FC = () => {
  const cloudAnimationDelays = useMemo(() => {
    return CLOUDS_CONFIG.map(cloud => `-${Math.random() * cloud.duration}s`);
  }, []);

  return (
    <>
      {CLOUDS_CONFIG.map((cloud, index) => (
        <div
          key={cloud.id}
          className="cloud"
          style={{
            top: cloud.y,
            width: cloud.width,
            height: cloud.height,
            opacity: cloud.opacity,
            animationDuration: `${cloud.duration}s`,
            animationDelay: cloudAnimationDelays[index],
            zIndex: 60, // Position clouds above trees (59) but below hovered items (100)
          }}
        >
          <img src={cloud.src} alt="animated cloud" className="w-full h-full" draggable="false" />
        </div>
      ))}
    </>
  );
};

export default Clouds;