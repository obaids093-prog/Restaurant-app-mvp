import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import safeStorage from '../utils/safeStorage';
import { colors, shadows as themeShadows, typography, spacing, radius, fonts } from '../theme/theme';

export const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = '@restaurant_app_theme_dark';

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const savedTheme = await safeStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme !== null) {
          setIsDark(JSON.parse(savedTheme));
        }
      } catch (e) {
        console.warn('Failed to load theme preference', e);
      }
    })();
  }, []);

  const toggleTheme = async () => {
    try {
      const nextValue = !isDark;
      setIsDark(nextValue);
      await safeStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(nextValue));
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  };

  const themeColors = isDark ? colors.dark : colors.light;

  const dynamicShadows = useMemo(() => ({
    ...themeShadows,
    card: isDark
      ? {
          borderColor: themeColors.cardBorder,
          borderWidth: 1,
          elevation: 0,
        }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 3,
        },
    button3D: {
      shadowColor: themeColors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 10,
      elevation: 4,
    },
    soft: isDark
      ? { borderColor: themeColors.cardBorder, borderWidth: 1 }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        },
    deep3D: isDark
      ? { borderColor: themeColors.cardBorder, borderWidth: 1 }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 6,
        },
  }), [isDark, themeColors]);

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        toggleTheme,
        colors: themeColors,
        shadows: dynamicShadows,
        typography,
        spacing,
        radius,
        fonts,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
