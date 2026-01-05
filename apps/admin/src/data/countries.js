// ISO 3166-1 alpha-2 country codes with names in multiple languages
export const COUNTRIES = [
  { code: 'AF', name: { en: 'Afghanistan', tr: 'Afganistan' }, region: 'asia' },
  { code: 'AL', name: { en: 'Albania', tr: 'Arnavutluk' }, region: 'europe' },
  { code: 'DZ', name: { en: 'Algeria', tr: 'Cezayir' }, region: 'africa' },
  { code: 'AD', name: { en: 'Andorra', tr: 'Andorra' }, region: 'europe' },
  { code: 'AO', name: { en: 'Angola', tr: 'Angola' }, region: 'africa' },
  { code: 'AG', name: { en: 'Antigua and Barbuda', tr: 'Antigua ve Barbuda' }, region: 'americas' },
  { code: 'AR', name: { en: 'Argentina', tr: 'Arjantin' }, region: 'americas' },
  { code: 'AM', name: { en: 'Armenia', tr: 'Ermenistan' }, region: 'asia' },
  { code: 'AU', name: { en: 'Australia', tr: 'Avustralya' }, region: 'oceania' },
  { code: 'AT', name: { en: 'Austria', tr: 'Avusturya' }, region: 'europe' },
  { code: 'AZ', name: { en: 'Azerbaijan', tr: 'Azerbaycan' }, region: 'asia' },
  { code: 'BS', name: { en: 'Bahamas', tr: 'Bahamalar' }, region: 'americas' },
  { code: 'BH', name: { en: 'Bahrain', tr: 'Bahreyn' }, region: 'asia' },
  { code: 'BD', name: { en: 'Bangladesh', tr: 'Bangladeş' }, region: 'asia' },
  { code: 'BB', name: { en: 'Barbados', tr: 'Barbados' }, region: 'americas' },
  { code: 'BY', name: { en: 'Belarus', tr: 'Belarus' }, region: 'europe' },
  { code: 'BE', name: { en: 'Belgium', tr: 'Belçika' }, region: 'europe' },
  { code: 'BZ', name: { en: 'Belize', tr: 'Belize' }, region: 'americas' },
  { code: 'BJ', name: { en: 'Benin', tr: 'Benin' }, region: 'africa' },
  { code: 'BT', name: { en: 'Bhutan', tr: 'Bhutan' }, region: 'asia' },
  { code: 'BO', name: { en: 'Bolivia', tr: 'Bolivya' }, region: 'americas' },
  { code: 'BA', name: { en: 'Bosnia and Herzegovina', tr: 'Bosna Hersek' }, region: 'europe' },
  { code: 'BW', name: { en: 'Botswana', tr: 'Botsvana' }, region: 'africa' },
  { code: 'BR', name: { en: 'Brazil', tr: 'Brezilya' }, region: 'americas' },
  { code: 'BN', name: { en: 'Brunei', tr: 'Brunei' }, region: 'asia' },
  { code: 'BG', name: { en: 'Bulgaria', tr: 'Bulgaristan' }, region: 'europe' },
  { code: 'BF', name: { en: 'Burkina Faso', tr: 'Burkina Faso' }, region: 'africa' },
  { code: 'BI', name: { en: 'Burundi', tr: 'Burundi' }, region: 'africa' },
  { code: 'KH', name: { en: 'Cambodia', tr: 'Kamboçya' }, region: 'asia' },
  { code: 'CM', name: { en: 'Cameroon', tr: 'Kamerun' }, region: 'africa' },
  { code: 'CA', name: { en: 'Canada', tr: 'Kanada' }, region: 'americas' },
  { code: 'CV', name: { en: 'Cape Verde', tr: 'Yeşil Burun' }, region: 'africa' },
  {
    code: 'CF',
    name: { en: 'Central African Republic', tr: 'Orta Afrika Cumhuriyeti' },
    region: 'africa'
  },
  { code: 'TD', name: { en: 'Chad', tr: 'Çad' }, region: 'africa' },
  { code: 'CL', name: { en: 'Chile', tr: 'Şili' }, region: 'americas' },
  { code: 'CN', name: { en: 'China', tr: 'Çin' }, region: 'asia' },
  { code: 'CO', name: { en: 'Colombia', tr: 'Kolombiya' }, region: 'americas' },
  { code: 'KM', name: { en: 'Comoros', tr: 'Komorlar' }, region: 'africa' },
  { code: 'CG', name: { en: 'Congo', tr: 'Kongo' }, region: 'africa' },
  { code: 'CR', name: { en: 'Costa Rica', tr: 'Kosta Rika' }, region: 'americas' },
  { code: 'HR', name: { en: 'Croatia', tr: 'Hırvatistan' }, region: 'europe' },
  { code: 'CU', name: { en: 'Cuba', tr: 'Küba' }, region: 'americas' },
  { code: 'CY', name: { en: 'Cyprus', tr: 'Kıbrıs' }, region: 'europe' },
  { code: 'CZ', name: { en: 'Czech Republic', tr: 'Çekya' }, region: 'europe' },
  { code: 'DK', name: { en: 'Denmark', tr: 'Danimarka' }, region: 'europe' },
  { code: 'DJ', name: { en: 'Djibouti', tr: 'Cibuti' }, region: 'africa' },
  { code: 'DM', name: { en: 'Dominica', tr: 'Dominika' }, region: 'americas' },
  { code: 'DO', name: { en: 'Dominican Republic', tr: 'Dominik Cumhuriyeti' }, region: 'americas' },
  { code: 'EC', name: { en: 'Ecuador', tr: 'Ekvador' }, region: 'americas' },
  { code: 'EG', name: { en: 'Egypt', tr: 'Mısır' }, region: 'africa' },
  { code: 'SV', name: { en: 'El Salvador', tr: 'El Salvador' }, region: 'americas' },
  { code: 'GQ', name: { en: 'Equatorial Guinea', tr: 'Ekvator Ginesi' }, region: 'africa' },
  { code: 'ER', name: { en: 'Eritrea', tr: 'Eritre' }, region: 'africa' },
  { code: 'EE', name: { en: 'Estonia', tr: 'Estonya' }, region: 'europe' },
  { code: 'ET', name: { en: 'Ethiopia', tr: 'Etiyopya' }, region: 'africa' },
  { code: 'FJ', name: { en: 'Fiji', tr: 'Fiji' }, region: 'oceania' },
  { code: 'FI', name: { en: 'Finland', tr: 'Finlandiya' }, region: 'europe' },
  { code: 'FR', name: { en: 'France', tr: 'Fransa' }, region: 'europe' },
  { code: 'GA', name: { en: 'Gabon', tr: 'Gabon' }, region: 'africa' },
  { code: 'GM', name: { en: 'Gambia', tr: 'Gambiya' }, region: 'africa' },
  { code: 'GE', name: { en: 'Georgia', tr: 'Gürcistan' }, region: 'asia' },
  { code: 'DE', name: { en: 'Germany', tr: 'Almanya' }, region: 'europe' },
  { code: 'GH', name: { en: 'Ghana', tr: 'Gana' }, region: 'africa' },
  { code: 'GR', name: { en: 'Greece', tr: 'Yunanistan' }, region: 'europe' },
  { code: 'GD', name: { en: 'Grenada', tr: 'Grenada' }, region: 'americas' },
  { code: 'GT', name: { en: 'Guatemala', tr: 'Guatemala' }, region: 'americas' },
  { code: 'GN', name: { en: 'Guinea', tr: 'Gine' }, region: 'africa' },
  { code: 'GW', name: { en: 'Guinea-Bissau', tr: 'Gine-Bissau' }, region: 'africa' },
  { code: 'GY', name: { en: 'Guyana', tr: 'Guyana' }, region: 'americas' },
  { code: 'HT', name: { en: 'Haiti', tr: 'Haiti' }, region: 'americas' },
  { code: 'HN', name: { en: 'Honduras', tr: 'Honduras' }, region: 'americas' },
  { code: 'HU', name: { en: 'Hungary', tr: 'Macaristan' }, region: 'europe' },
  { code: 'IS', name: { en: 'Iceland', tr: 'İzlanda' }, region: 'europe' },
  { code: 'IN', name: { en: 'India', tr: 'Hindistan' }, region: 'asia' },
  { code: 'ID', name: { en: 'Indonesia', tr: 'Endonezya' }, region: 'asia' },
  { code: 'IR', name: { en: 'Iran', tr: 'İran' }, region: 'asia' },
  { code: 'IQ', name: { en: 'Iraq', tr: 'Irak' }, region: 'asia' },
  { code: 'IE', name: { en: 'Ireland', tr: 'İrlanda' }, region: 'europe' },
  { code: 'IL', name: { en: 'Israel', tr: 'İsrail' }, region: 'asia' },
  { code: 'IT', name: { en: 'Italy', tr: 'İtalya' }, region: 'europe' },
  { code: 'CI', name: { en: 'Ivory Coast', tr: 'Fildişi Sahili' }, region: 'africa' },
  { code: 'JM', name: { en: 'Jamaica', tr: 'Jamaika' }, region: 'americas' },
  { code: 'JP', name: { en: 'Japan', tr: 'Japonya' }, region: 'asia' },
  { code: 'JO', name: { en: 'Jordan', tr: 'Ürdün' }, region: 'asia' },
  { code: 'KZ', name: { en: 'Kazakhstan', tr: 'Kazakistan' }, region: 'asia' },
  { code: 'KE', name: { en: 'Kenya', tr: 'Kenya' }, region: 'africa' },
  { code: 'KI', name: { en: 'Kiribati', tr: 'Kiribati' }, region: 'oceania' },
  { code: 'KW', name: { en: 'Kuwait', tr: 'Kuveyt' }, region: 'asia' },
  { code: 'KG', name: { en: 'Kyrgyzstan', tr: 'Kırgızistan' }, region: 'asia' },
  { code: 'LA', name: { en: 'Laos', tr: 'Laos' }, region: 'asia' },
  { code: 'LV', name: { en: 'Latvia', tr: 'Letonya' }, region: 'europe' },
  { code: 'LB', name: { en: 'Lebanon', tr: 'Lübnan' }, region: 'asia' },
  { code: 'LS', name: { en: 'Lesotho', tr: 'Lesotho' }, region: 'africa' },
  { code: 'LR', name: { en: 'Liberia', tr: 'Liberya' }, region: 'africa' },
  { code: 'LY', name: { en: 'Libya', tr: 'Libya' }, region: 'africa' },
  { code: 'LI', name: { en: 'Liechtenstein', tr: 'Lihtenştayn' }, region: 'europe' },
  { code: 'LT', name: { en: 'Lithuania', tr: 'Litvanya' }, region: 'europe' },
  { code: 'LU', name: { en: 'Luxembourg', tr: 'Lüksemburg' }, region: 'europe' },
  { code: 'MK', name: { en: 'North Macedonia', tr: 'Kuzey Makedonya' }, region: 'europe' },
  { code: 'MG', name: { en: 'Madagascar', tr: 'Madagaskar' }, region: 'africa' },
  { code: 'MW', name: { en: 'Malawi', tr: 'Malavi' }, region: 'africa' },
  { code: 'MY', name: { en: 'Malaysia', tr: 'Malezya' }, region: 'asia' },
  { code: 'MV', name: { en: 'Maldives', tr: 'Maldivler' }, region: 'asia' },
  { code: 'ML', name: { en: 'Mali', tr: 'Mali' }, region: 'africa' },
  { code: 'MT', name: { en: 'Malta', tr: 'Malta' }, region: 'europe' },
  { code: 'MH', name: { en: 'Marshall Islands', tr: 'Marshall Adaları' }, region: 'oceania' },
  { code: 'MR', name: { en: 'Mauritania', tr: 'Moritanya' }, region: 'africa' },
  { code: 'MU', name: { en: 'Mauritius', tr: 'Mauritius' }, region: 'africa' },
  { code: 'MX', name: { en: 'Mexico', tr: 'Meksika' }, region: 'americas' },
  { code: 'FM', name: { en: 'Micronesia', tr: 'Mikronezya' }, region: 'oceania' },
  { code: 'MD', name: { en: 'Moldova', tr: 'Moldova' }, region: 'europe' },
  { code: 'MC', name: { en: 'Monaco', tr: 'Monako' }, region: 'europe' },
  { code: 'MN', name: { en: 'Mongolia', tr: 'Moğolistan' }, region: 'asia' },
  { code: 'ME', name: { en: 'Montenegro', tr: 'Karadağ' }, region: 'europe' },
  { code: 'MA', name: { en: 'Morocco', tr: 'Fas' }, region: 'africa' },
  { code: 'MZ', name: { en: 'Mozambique', tr: 'Mozambik' }, region: 'africa' },
  { code: 'MM', name: { en: 'Myanmar', tr: 'Myanmar' }, region: 'asia' },
  { code: 'NA', name: { en: 'Namibia', tr: 'Namibya' }, region: 'africa' },
  { code: 'NR', name: { en: 'Nauru', tr: 'Nauru' }, region: 'oceania' },
  { code: 'NP', name: { en: 'Nepal', tr: 'Nepal' }, region: 'asia' },
  { code: 'NL', name: { en: 'Netherlands', tr: 'Hollanda' }, region: 'europe' },
  { code: 'NZ', name: { en: 'New Zealand', tr: 'Yeni Zelanda' }, region: 'oceania' },
  { code: 'NI', name: { en: 'Nicaragua', tr: 'Nikaragua' }, region: 'americas' },
  { code: 'NE', name: { en: 'Niger', tr: 'Nijer' }, region: 'africa' },
  { code: 'NG', name: { en: 'Nigeria', tr: 'Nijerya' }, region: 'africa' },
  { code: 'KP', name: { en: 'North Korea', tr: 'Kuzey Kore' }, region: 'asia' },
  { code: 'NO', name: { en: 'Norway', tr: 'Norveç' }, region: 'europe' },
  { code: 'OM', name: { en: 'Oman', tr: 'Umman' }, region: 'asia' },
  { code: 'PK', name: { en: 'Pakistan', tr: 'Pakistan' }, region: 'asia' },
  { code: 'PW', name: { en: 'Palau', tr: 'Palau' }, region: 'oceania' },
  { code: 'PS', name: { en: 'Palestine', tr: 'Filistin' }, region: 'asia' },
  { code: 'PA', name: { en: 'Panama', tr: 'Panama' }, region: 'americas' },
  { code: 'PG', name: { en: 'Papua New Guinea', tr: 'Papua Yeni Gine' }, region: 'oceania' },
  { code: 'PY', name: { en: 'Paraguay', tr: 'Paraguay' }, region: 'americas' },
  { code: 'PE', name: { en: 'Peru', tr: 'Peru' }, region: 'americas' },
  { code: 'PH', name: { en: 'Philippines', tr: 'Filipinler' }, region: 'asia' },
  { code: 'PL', name: { en: 'Poland', tr: 'Polonya' }, region: 'europe' },
  { code: 'PT', name: { en: 'Portugal', tr: 'Portekiz' }, region: 'europe' },
  { code: 'QA', name: { en: 'Qatar', tr: 'Katar' }, region: 'asia' },
  { code: 'RO', name: { en: 'Romania', tr: 'Romanya' }, region: 'europe' },
  { code: 'RU', name: { en: 'Russia', tr: 'Rusya' }, region: 'europe' },
  { code: 'RW', name: { en: 'Rwanda', tr: 'Ruanda' }, region: 'africa' },
  {
    code: 'KN',
    name: { en: 'Saint Kitts and Nevis', tr: 'Saint Kitts ve Nevis' },
    region: 'americas'
  },
  { code: 'LC', name: { en: 'Saint Lucia', tr: 'Saint Lucia' }, region: 'americas' },
  {
    code: 'VC',
    name: { en: 'Saint Vincent and the Grenadines', tr: 'Saint Vincent ve Grenadinler' },
    region: 'americas'
  },
  { code: 'WS', name: { en: 'Samoa', tr: 'Samoa' }, region: 'oceania' },
  { code: 'SM', name: { en: 'San Marino', tr: 'San Marino' }, region: 'europe' },
  {
    code: 'ST',
    name: { en: 'Sao Tome and Principe', tr: 'Sao Tome ve Principe' },
    region: 'africa'
  },
  { code: 'SA', name: { en: 'Saudi Arabia', tr: 'Suudi Arabistan' }, region: 'asia' },
  { code: 'SN', name: { en: 'Senegal', tr: 'Senegal' }, region: 'africa' },
  { code: 'RS', name: { en: 'Serbia', tr: 'Sırbistan' }, region: 'europe' },
  { code: 'SC', name: { en: 'Seychelles', tr: 'Seyşeller' }, region: 'africa' },
  { code: 'SL', name: { en: 'Sierra Leone', tr: 'Sierra Leone' }, region: 'africa' },
  { code: 'SG', name: { en: 'Singapore', tr: 'Singapur' }, region: 'asia' },
  { code: 'SK', name: { en: 'Slovakia', tr: 'Slovakya' }, region: 'europe' },
  { code: 'SI', name: { en: 'Slovenia', tr: 'Slovenya' }, region: 'europe' },
  { code: 'SB', name: { en: 'Solomon Islands', tr: 'Solomon Adaları' }, region: 'oceania' },
  { code: 'SO', name: { en: 'Somalia', tr: 'Somali' }, region: 'africa' },
  { code: 'ZA', name: { en: 'South Africa', tr: 'Güney Afrika' }, region: 'africa' },
  { code: 'KR', name: { en: 'South Korea', tr: 'Güney Kore' }, region: 'asia' },
  { code: 'SS', name: { en: 'South Sudan', tr: 'Güney Sudan' }, region: 'africa' },
  { code: 'ES', name: { en: 'Spain', tr: 'İspanya' }, region: 'europe' },
  { code: 'LK', name: { en: 'Sri Lanka', tr: 'Sri Lanka' }, region: 'asia' },
  { code: 'SD', name: { en: 'Sudan', tr: 'Sudan' }, region: 'africa' },
  { code: 'SR', name: { en: 'Suriname', tr: 'Surinam' }, region: 'americas' },
  { code: 'SZ', name: { en: 'Eswatini', tr: 'Esvatini' }, region: 'africa' },
  { code: 'SE', name: { en: 'Sweden', tr: 'İsveç' }, region: 'europe' },
  { code: 'CH', name: { en: 'Switzerland', tr: 'İsviçre' }, region: 'europe' },
  { code: 'SY', name: { en: 'Syria', tr: 'Suriye' }, region: 'asia' },
  { code: 'TW', name: { en: 'Taiwan', tr: 'Tayvan' }, region: 'asia' },
  { code: 'TJ', name: { en: 'Tajikistan', tr: 'Tacikistan' }, region: 'asia' },
  { code: 'TZ', name: { en: 'Tanzania', tr: 'Tanzanya' }, region: 'africa' },
  { code: 'TH', name: { en: 'Thailand', tr: 'Tayland' }, region: 'asia' },
  { code: 'TL', name: { en: 'Timor-Leste', tr: 'Doğu Timor' }, region: 'asia' },
  { code: 'TG', name: { en: 'Togo', tr: 'Togo' }, region: 'africa' },
  { code: 'TO', name: { en: 'Tonga', tr: 'Tonga' }, region: 'oceania' },
  { code: 'TT', name: { en: 'Trinidad and Tobago', tr: 'Trinidad ve Tobago' }, region: 'americas' },
  { code: 'TN', name: { en: 'Tunisia', tr: 'Tunus' }, region: 'africa' },
  { code: 'TR', name: { en: 'Turkey', tr: 'Türkiye' }, region: 'europe' },
  { code: 'TM', name: { en: 'Turkmenistan', tr: 'Türkmenistan' }, region: 'asia' },
  { code: 'TV', name: { en: 'Tuvalu', tr: 'Tuvalu' }, region: 'oceania' },
  { code: 'UG', name: { en: 'Uganda', tr: 'Uganda' }, region: 'africa' },
  { code: 'UA', name: { en: 'Ukraine', tr: 'Ukrayna' }, region: 'europe' },
  {
    code: 'AE',
    name: { en: 'United Arab Emirates', tr: 'Birleşik Arap Emirlikleri' },
    region: 'asia'
  },
  { code: 'GB', name: { en: 'United Kingdom', tr: 'Birleşik Krallık' }, region: 'europe' },
  {
    code: 'US',
    name: { en: 'United States', tr: 'Amerika Birleşik Devletleri' },
    region: 'americas'
  },
  { code: 'UY', name: { en: 'Uruguay', tr: 'Uruguay' }, region: 'americas' },
  { code: 'UZ', name: { en: 'Uzbekistan', tr: 'Özbekistan' }, region: 'asia' },
  { code: 'VU', name: { en: 'Vanuatu', tr: 'Vanuatu' }, region: 'oceania' },
  { code: 'VA', name: { en: 'Vatican City', tr: 'Vatikan' }, region: 'europe' },
  { code: 'VE', name: { en: 'Venezuela', tr: 'Venezuela' }, region: 'americas' },
  { code: 'VN', name: { en: 'Vietnam', tr: 'Vietnam' }, region: 'asia' },
  { code: 'YE', name: { en: 'Yemen', tr: 'Yemen' }, region: 'asia' },
  { code: 'ZM', name: { en: 'Zambia', tr: 'Zambiya' }, region: 'africa' },
  { code: 'ZW', name: { en: 'Zimbabwe', tr: 'Zimbabve' }, region: 'africa' }
]

// Regions for filtering
export const REGIONS = [
  { code: 'europe', name: { en: 'Europe', tr: 'Avrupa' } },
  { code: 'asia', name: { en: 'Asia', tr: 'Asya' } },
  { code: 'americas', name: { en: 'Americas', tr: 'Amerika' } },
  { code: 'africa', name: { en: 'Africa', tr: 'Afrika' } },
  { code: 'oceania', name: { en: 'Oceania', tr: 'Okyanusya' } }
]

// Common/popular countries for quick selection (global)
export const POPULAR_COUNTRIES = [
  'TR',
  'DE',
  'GB',
  'RU',
  'NL',
  'BE',
  'FR',
  'IT',
  'ES',
  'AT',
  'CH',
  'PL',
  'UA',
  'SA',
  'AE',
  'US',
  'CA',
  'AU',
  'JP',
  'CN'
]

// Popular countries by region
export const POPULAR_COUNTRIES_BY_REGION = {
  europe: [
    'TR',
    'DE',
    'GB',
    'RU',
    'NL',
    'BE',
    'FR',
    'IT',
    'ES',
    'AT',
    'CH',
    'PL',
    'UA',
    'GR',
    'PT',
    'SE',
    'NO',
    'DK',
    'FI',
    'CZ'
  ],
  asia: [
    'SA',
    'AE',
    'CN',
    'JP',
    'KR',
    'IN',
    'ID',
    'MY',
    'TH',
    'SG',
    'PH',
    'VN',
    'IL',
    'QA',
    'KW',
    'BH',
    'IR',
    'PK',
    'KZ',
    'UZ'
  ],
  americas: [
    'US',
    'CA',
    'MX',
    'BR',
    'AR',
    'CL',
    'CO',
    'PE',
    'VE',
    'EC',
    'CU',
    'DO',
    'JM',
    'PA',
    'CR'
  ],
  africa: [
    'EG',
    'MA',
    'TN',
    'ZA',
    'NG',
    'KE',
    'TZ',
    'GH',
    'ET',
    'DZ',
    'LY',
    'SN',
    'RW',
    'MU',
    'CM'
  ],
  oceania: ['AU', 'NZ', 'FJ', 'PG', 'WS', 'TO', 'VU', 'SB', 'KI', 'MH']
}

// Supported currencies
export const CURRENCIES = [
  { code: 'TRY', symbol: '₺', name: { en: 'Turkish Lira', tr: 'Türk Lirası' } },
  { code: 'USD', symbol: '$', name: { en: 'US Dollar', tr: 'Amerikan Doları' } },
  { code: 'EUR', symbol: '€', name: { en: 'Euro', tr: 'Euro' } },
  { code: 'GBP', symbol: '£', name: { en: 'British Pound', tr: 'İngiliz Sterlini' } }
]

// Helper to convert country code to flag emoji
export const getCountryFlag = countryCode => {
  if (!countryCode || countryCode.length !== 2) return ''
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

// Add flag property to all countries
COUNTRIES.forEach(country => {
  country.flag = getCountryFlag(country.code)
})

// Get popular countries as full objects with flags
// If region is specified, returns popular countries for that region
export const getPopularCountries = (region = null) => {
  const codes =
    region && POPULAR_COUNTRIES_BY_REGION[region]
      ? POPULAR_COUNTRIES_BY_REGION[region]
      : POPULAR_COUNTRIES
  return codes.map(code => COUNTRIES.find(c => c.code === code)).filter(Boolean)
}

// Helper to get country name by locale
export const getCountryName = (code, locale = 'en') => {
  const country = COUNTRIES.find(c => c.code === code)
  return country?.name?.[locale] || country?.name?.en || code
}

// Helper to get region name by locale
export const getRegionName = (code, locale = 'en') => {
  const region = REGIONS.find(r => r.code === code)
  return region?.name?.[locale] || region?.name?.en || code
}

// Helper to get currency info
export const getCurrencyInfo = code => {
  return CURRENCIES.find(c => c.code === code)
}
