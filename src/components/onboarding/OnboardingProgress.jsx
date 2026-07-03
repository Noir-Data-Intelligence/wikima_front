import React from 'react';

export default function OnboardingProgress({ currentStep, totalSteps }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i < currentStep
              ? 'w-8 bg-primary'
              : i === currentStep
              ? 'w-12 bg-primary'
              : 'w-8 bg-white/20'
          }`}
        />
      ))}
    </div>
  );
}