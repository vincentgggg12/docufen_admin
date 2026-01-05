import { Stage } from './lifecycle';

export const getStageColor = (stage: Stage): string => {
  switch (stage) {
    case Stage.Execute:
      return '#6366f1'; // Indigo
    case Stage.PreApprove:
      return '#FFA100'; // Orange
    case Stage.PostApprove:
      return '#9C27B0'; // Purple
    default:
      return '#6366f1'; // Default to Execute color
  }
};

export const createCopyCursorSVG = (color: string): string => {
  // Create an SVG cursor that matches the OS copy cursor but with custom circle color
  // Using the same dimensions and proportions as the system cursor
  const svg = `
    <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <g>
        <!-- White outline for cursor -->
        <path d="M5,2 L5,20 L9.5,15.5 L13,22 L16,20.5 L12.5,14 L18,14 Z" 
              fill="white" stroke="white" stroke-width="1" stroke-linejoin="round"/>
        <!-- Black cursor arrow (standard pointer shape) -->
        <path d="M6,4 L6,17 L9,14 L12,19 L14,18 L11,13 L15,13 Z" 
              fill="black"/>
        <!-- Circle with custom color -->
        <circle cx="20" cy="20" r="8" fill="${color}" stroke="white" stroke-width="1.5"/>
        <!-- White plus sign -->
        <path d="M20,16 L20,24 M16,20 L24,20" 
              stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      </g>
    </svg>
  `;
  
  // Convert SVG to data URL
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};