import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Currency configuration with symbols and formatting
export const CURRENCIES = {
    // Africa
    GHS: { symbol: 'GH₵', name: 'Ghanaian Cedi', locale: 'en-GH', flag: '🇬🇭' },
    NGN: { symbol: '₦', name: 'Nigerian Naira', locale: 'en-NG', flag: '🇳🇬' },
    KES: { symbol: 'KSh', name: 'Kenyan Shilling', locale: 'en-KE', flag: '🇰🇪' },
    ZAR: { symbol: 'R', name: 'South African Rand', locale: 'en-ZA', flag: '🇿🇦' },
    EGP: { symbol: 'E£', name: 'Egyptian Pound', locale: 'ar-EG', flag: '🇪🇬' },
    TZS: { symbol: 'TSh', name: 'Tanzanian Shilling', locale: 'sw-TZ', flag: '🇹🇿' },
    UGX: { symbol: 'USh', name: 'Ugandan Shilling', locale: 'en-UG', flag: '🇺🇬' },
    MAD: { symbol: 'DH', name: 'Moroccan Dirham', locale: 'ar-MA', flag: '🇲🇦' },
    XOF: { symbol: 'CFA', name: 'West African CFA Franc', locale: 'fr-SN', flag: '🌍' },
    XAF: { symbol: 'FCFA', name: 'Central African CFA Franc', locale: 'fr-CM', flag: '🌍' },

    // Americas
    USD: { symbol: '$', name: 'US Dollar', locale: 'en-US', flag: '🇺🇸' },
    CAD: { symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA', flag: '🇨🇦' },
    BRL: { symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR', flag: '🇧🇷' },
    MXN: { symbol: 'Mex$', name: 'Mexican Peso', locale: 'es-MX', flag: '🇲🇽' },
    ARS: { symbol: '$', name: 'Argentine Peso', locale: 'es-AR', flag: '🇦🇷' },
    CLP: { symbol: '$', name: 'Chilean Peso', locale: 'es-CL', flag: '🇨🇱' },
    COP: { symbol: '$', name: 'Colombian Peso', locale: 'es-CO', flag: '🇨🇴' },
    PEN: { symbol: 'S/', name: 'Peruvian Sol', locale: 'es-PE', flag: '🇵🇪' },

    // Europe
    EUR: { symbol: '€', name: 'Euro', locale: 'de-DE', flag: '🇪🇺' },
    GBP: { symbol: '£', name: 'British Pound', locale: 'en-GB', flag: '🇬🇧' },
    CHF: { symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH', flag: '🇨🇭' },
    SEK: { symbol: 'kr', name: 'Swedish Krona', locale: 'sv-SE', flag: '🇸🇪' },
    NOK: { symbol: 'kr', name: 'Norwegian Krone', locale: 'nb-NO', flag: '🇳🇴' },
    DKK: { symbol: 'kr', name: 'Danish Krone', locale: 'da-DK', flag: '🇩🇰' },
    PLN: { symbol: 'zł', name: 'Polish Złoty', locale: 'pl-PL', flag: '🇵🇱' },
    CZK: { symbol: 'Kč', name: 'Czech Koruna', locale: 'cs-CZ', flag: '🇨🇿' },
    HUF: { symbol: 'Ft', name: 'Hungarian Forint', locale: 'hu-HU', flag: '🇭🇺' },
    RON: { symbol: 'lei', name: 'Romanian Leu', locale: 'ro-RO', flag: '🇷🇴' },

    // Asia
    CNY: { symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN', flag: '🇨🇳' },
    JPY: { symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', flag: '🇯🇵' },
    INR: { symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', flag: '🇮🇳' },
    KRW: { symbol: '₩', name: 'South Korean Won', locale: 'ko-KR', flag: '🇰🇷' },
    SGD: { symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', flag: '🇸🇬' },
    HKD: { symbol: 'HK$', name: 'Hong Kong Dollar', locale: 'zh-HK', flag: '🇭🇰' },
    THB: { symbol: '฿', name: 'Thai Baht', locale: 'th-TH', flag: '🇹🇭' },
    MYR: { symbol: 'RM', name: 'Malaysian Ringgit', locale: 'ms-MY', flag: '🇲🇾' },
    IDR: { symbol: 'Rp', name: 'Indonesian Rupiah', locale: 'id-ID', flag: '🇮🇩' },
    PHP: { symbol: '₱', name: 'Philippine Peso', locale: 'en-PH', flag: '🇵🇭' },
    VND: { symbol: '₫', name: 'Vietnamese Dong', locale: 'vi-VN', flag: '🇻🇳' },
    PKR: { symbol: 'Rs', name: 'Pakistani Rupee', locale: 'ur-PK', flag: '🇵🇰' },
    BDT: { symbol: '৳', name: 'Bangladeshi Taka', locale: 'bn-BD', flag: '🇧🇩' },
    LKR: { symbol: 'Rs', name: 'Sri Lankan Rupee', locale: 'si-LK', flag: '🇱🇰' },

    // Middle East
    AED: { symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE', flag: '🇦🇪' },
    SAR: { symbol: '﷼', name: 'Saudi Riyal', locale: 'ar-SA', flag: '🇸🇦' },
    QAR: { symbol: '﷼', name: 'Qatari Riyal', locale: 'ar-QA', flag: '🇶🇦' },
    KWD: { symbol: 'د.ك', name: 'Kuwaiti Dinar', locale: 'ar-KW', flag: '🇰🇼' },
    BHD: { symbol: 'د.ب', name: 'Bahraini Dinar', locale: 'ar-BH', flag: '🇧🇭' },
    OMR: { symbol: '﷼', name: 'Omani Rial', locale: 'ar-OM', flag: '🇴🇲' },
    JOD: { symbol: 'د.ا', name: 'Jordanian Dinar', locale: 'ar-JO', flag: '🇯🇴' },
    ILS: { symbol: '₪', name: 'Israeli Shekel', locale: 'he-IL', flag: '🇮🇱' },
    TRY: { symbol: '₺', name: 'Turkish Lira', locale: 'tr-TR', flag: '🇹🇷' },

    // Oceania
    AUD: { symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', flag: '🇦🇺' },
    NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', locale: 'en-NZ', flag: '🇳🇿' },

    // Cryptocurrency
    BTC: { symbol: '₿', name: 'Bitcoin', locale: 'en-US', flag: '₿' },
    ETH: { symbol: 'Ξ', name: 'Ethereum', locale: 'en-US', flag: 'Ξ' },
    USDT: { symbol: '₮', name: 'Tether', locale: 'en-US', flag: '₮' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const LANGUAGES = {
    English: { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', rtl: false },
    French: { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
    Spanish: { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
    Portuguese: { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', rtl: false },
    Arabic: { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
    Swahili: { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪', rtl: false },
    Twi: { code: 'tw', name: 'Twi', nativeName: 'Twi', flag: '🇬🇭', rtl: false },
    Hausa: { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬', rtl: false },
    Yoruba: { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬', rtl: false },
    Igbo: { code: 'ig', name: 'Igbo', nativeName: 'Igbo', flag: '🇳🇬', rtl: false },
    Amharic: { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹', rtl: false },
    Zulu: { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦', rtl: false },
    Afrikaans: { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦', rtl: false },
} as const;

export type LanguageKey = keyof typeof LANGUAGES;

interface UserPreferences {
    currency: CurrencyCode;
    language: LanguageKey;
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    theme: 'light' | 'dark' | 'system';
    timezone: string;
}

interface PreferencesContextType {
    preferences: UserPreferences;
    updatePreferences: (prefs: Partial<UserPreferences>) => void;
    formatCurrency: (amount: number) => string;
    formatDate: (date: Date | string) => string;
    t: (key: string) => string; // Translation function
}

const defaultPreferences: UserPreferences = {
    currency: 'GHS',
    language: 'English',
    dateFormat: 'DD/MM/YYYY',
    theme: 'light',
    timezone: 'GMT',
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
    const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

    // Load preferences from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('userPreferences');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setPreferences({ ...defaultPreferences, ...parsed });
            } catch (error) {
                console.error('Failed to load preferences:', error);
            }
        }
    }, []);

    // Apply theme when preferences change
    useEffect(() => {
        const applyTheme = () => {
            if (preferences.theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else if (preferences.theme === 'light') {
                document.documentElement.classList.remove('dark');
            } else {
                // System theme
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        };

        applyTheme();

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (preferences.theme === 'system') {
                applyTheme();
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [preferences.theme]);

    // Apply language direction (RTL for Arabic)
    useEffect(() => {
        const lang = LANGUAGES[preferences.language];
        if (lang) {
            document.documentElement.dir = lang.rtl ? 'rtl' : 'ltr';
            document.documentElement.lang = lang.code;
        }
    }, [preferences.language]);

    const updatePreferences = (newPrefs: Partial<UserPreferences>) => {
        setPreferences((prev) => {
            const updated = { ...prev, ...newPrefs };
            localStorage.setItem('userPreferences', JSON.stringify(updated));
            return updated;
        });
    };

    const formatCurrency = (amount: number): string => {
        const currency = CURRENCIES[preferences.currency];

        if (!currency) {
            // Fallback to GHS if currency not found
            return `GH₵${amount.toLocaleString()}`;
        }

        try {
            // Use Intl.NumberFormat for proper locale-based formatting
            const formatter = new Intl.NumberFormat(currency.locale, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            });

            return `${currency.symbol}${formatter.format(amount)}`;
        } catch (error) {
            // Fallback formatting
            return `${currency.symbol}${amount.toLocaleString()}`;
        }
    };

    const formatDate = (date: Date | string): string => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;

        if (isNaN(dateObj.getTime())) {
            return 'Invalid Date';
        }

        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();

        switch (preferences.dateFormat) {
            case 'MM/DD/YYYY':
                return `${month}/${day}/${year}`;
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'DD/MM/YYYY':
            default:
                return `${day}/${month}/${year}`;
        }
    };

    // Simple translation function (would be connected to i18n in production)
    const t = (key: string): string => {
        // This is a placeholder - in production, you'd use a proper i18n library
        // For now, we return the key itself
        return key;
    };

    return (
        <PreferencesContext.Provider
            value={{
                preferences,
                updatePreferences,
                formatCurrency,
                formatDate,
                t,
            }}
        >
            {children}
        </PreferencesContext.Provider>
    );
}

export function usePreferences() {
    const context = useContext(PreferencesContext);
    if (context === undefined) {
        throw new Error('usePreferences must be used within a PreferencesProvider');
    }
    return context;
}

// Export helper function to get currency info
export function getCurrencyInfo(code: CurrencyCode) {
    return CURRENCIES[code];
}

// Export helper function to get language info
export function getLanguageInfo(key: LanguageKey) {
    return LANGUAGES[key];
}
