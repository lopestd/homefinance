import { useState, useEffect } from 'react';

/**
 * Hook para garantir que o container tenha dimensões válidas antes de renderizar
 * Resolve warnings do Recharts sobre dimensões negativas
 */
export const useChartReady = (ref) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Usar múltiplas estratégias para garantir que o container esteja pronto
    
    // Estratégia 1: requestAnimationFrame
    const rafId = requestAnimationFrame(() => {
      // Estratégia 2: Verificar se o elemento tem dimensões
      const element = ref.current;
      if (element) {
        const { offsetWidth, offsetHeight } = element;
        if (offsetWidth > 0 && offsetHeight > 0) {
          setIsReady(true);
          return;
        }
      }
      
      // Estratégia 3: Timeout como fallback final
      setTimeout(() => {
        setIsReady(true);
      }, 100);
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [ref]);

  return isReady;
};

/**
 * Hook alternativo usando apenas timeout
 */
export const useChartDelay = (delay = 50) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsReady(true);
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay]);

  return isReady;
};
