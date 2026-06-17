
import React from 'react';
import { SortShort } from '../types';

interface FloatingOverlayProps {
  short: SortShort;
  currentTime: number;
}

const FloatingOverlay: React.FC<FloatingOverlayProps> = ({ short, currentTime }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-8 bg-gradient-to-t from-black/95 via-transparent to-transparent z-10 opacity-70" />
  );
};

export default FloatingOverlay;
