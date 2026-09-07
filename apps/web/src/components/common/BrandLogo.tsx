import React from 'react';
import { cn } from '../../lib/utils';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className,
  size = 'md',
  showText = false,
  subtitle = 'ENTERPRISE SALES',
}) => {
  const sizeMap = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-[42px] h-[42px] rounded-xl',
    lg: 'w-12 h-12 rounded-xl',
    xl: 'w-14 h-14 rounded-2xl',
  };

  return (
    <div className={cn('flex items-center gap-3 select-none', className)}>
      <div className="relative shrink-0 flex items-center justify-center">
        <img
          src="/logo.png"
          alt="7BLOCKS CRM"
          className={cn(
            sizeMap[size],
            'object-contain shadow-lg shadow-brand-500/20 ring-1 ring-white/10 transition-transform duration-200 hover:scale-105'
          )}
        />
      </div>
      {showText && (
        <div className="flex flex-col justify-center min-w-0">
          <span className="font-bold text-[14px] leading-tight tracking-wider text-slate-100 uppercase">
            7BLOCKS CRM
          </span>
          {subtitle && (
            <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
