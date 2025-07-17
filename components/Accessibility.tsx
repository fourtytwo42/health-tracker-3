'use client';

import React from 'react';
import { Box, Link } from '@mui/material';
import useTranslation from 'next-translate/useTranslation';

interface SkipLinkProps {
  targetId: string;
  children: React.ReactNode;
}

export function SkipLink({ targetId, children }: SkipLinkProps) {
  const { t } = useTranslation('common');

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Link
      href={`#${targetId}`}
      onClick={handleClick}
      sx={{
        position: 'absolute',
        top: '-40px',
        left: '6px',
        zIndex: 1000,
        padding: '8px 16px',
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        textDecoration: 'none',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: 500,
        '&:focus': {
          top: '6px',
          transition: 'top 0.3s ease',
        },
        '&:hover': {
          backgroundColor: 'primary.dark',
        },
      }}
    >
      {children}
    </Link>
  );
}

export function SkipLinks() {
  const { t } = useTranslation('common');

  return (
    <Box component="nav" aria-label="Skip links">
      <SkipLink targetId="main-content">
        {t('accessibility.skipToContent')}
      </SkipLink>
      <SkipLink targetId="main-navigation">
        {t('accessibility.skipToNavigation')}
      </SkipLink>
    </Box>
  );
}

interface LiveRegionProps {
  children: React.ReactNode;
  role?: 'status' | 'alert' | 'log' | 'timer';
  'aria-live'?: 'polite' | 'assertive' | 'off';
}

export function LiveRegion({ 
  children, 
  role = 'status', 
  'aria-live': ariaLive = 'polite' 
}: LiveRegionProps) {
  return (
    <Box
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      sx={{
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
    >
      {children}
    </Box>
  );
}

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
}

export function FocusTrap({ children, active = false }: FocusTrapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [active]);

  return (
    <Box ref={containerRef} tabIndex={active ? -1 : undefined}>
      {children}
    </Box>
  );
}

interface ScreenReaderOnlyProps {
  children: React.ReactNode;
}

export function ScreenReaderOnly({ children }: ScreenReaderOnlyProps) {
  return (
    <Box
      sx={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </Box>
  );
}

interface VisuallyHiddenProps {
  children: React.ReactNode;
  focusable?: boolean;
}

export function VisuallyHidden({ children, focusable = false }: VisuallyHiddenProps) {
  return (
    <Box
      sx={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
        ...(focusable && {
          '&:focus': {
            position: 'static',
            width: 'auto',
            height: 'auto',
            margin: 0,
            overflow: 'visible',
            clip: 'auto',
            whiteSpace: 'normal',
          },
        }),
      }}
    >
      {children}
    </Box>
  );
} 