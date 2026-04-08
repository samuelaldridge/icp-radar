// Fortune 500 companies list (2024) - company names normalized to lowercase for matching
const FORTUNE_500_NAMES = new Set([
  'walmart', 'amazon', 'apple', 'unitedhealth group', 'berkshire hathaway',
  'cvs health', 'exxon mobil', 'alphabet', 'mckesson', 'amerisourcebergen',
  'costco wholesale', 'cigna', 'at&t', 'microsoft', 'cardinal health',
  'chevron', 'home depot', 'walgreens boots alliance', 'elevance health',
  'kroger', 'ford motor', 'jpmorgan chase', 'general motors', 'cencora',
  'verizon communications', 'comcast', 'meta platforms', 'cigna group',
  'bank of america', 'marathon petroleum', 'phillips 66', 'valero energy',
  'citigroup', 'pfizer', 'johnson & johnson', 'humana', 'procter & gamble',
  'energy transfer', 'wells fargo', 'tesla', 'centene', 'dell technologies',
  'archer daniels midland', 'anthem', 'disney', 'general electric',
  'target', 'fedex', 'ups', 'caterpillar', '3m', 'deere', 'boeing',
  'lockheed martin', 'intel', 'ibm', 'cisco', 'oracle', 'salesforce',
  'adobe', 'nvidia', 'paypal', 'goldman sachs', 'morgan stanley',
  'american express', 'mastercard', 'visa', 'blackrock', 'charles schwab',
  'allstate', 'progressive', 'aetna', 'medtronic', 'abbott laboratories',
  'merck', 'abbvie', 'bristol-myers squibb', 'eli lilly', 'amgen',
  'gilead sciences', 'regeneron pharmaceuticals', 'biogen', 'moderna',
  'honeywell international', 'raytheon technologies', 'rtx', 'northrop grumman',
  'general dynamics', 'l3harris technologies', 'textron', 'parker hannifin',
  'emerson electric', 'eaton', 'illinois tool works', 'dover',
  'danaher', 'thermo fisher scientific', 'agilent technologies',
  'uber', 'lyft', 'airbnb', 'doordash', 'instacart', 'stripe', 'square',
  'block', 'palantir', 'snowflake', 'databricks', 'twilio', 'zendesk',
  'workday', 'servicenow', 'splunk', 'datadog', 'crowdstrike', 'okta',
  'palo alto networks', 'fortinet', 'cloudflare', 'hubspot', 'shopify',
  'sprint', 't-mobile', 'charter communications', 'dish network',
  'tyson foods', 'conagra brands', 'general mills', 'kellogg', 'campbell soup',
  'hershey', 'mondelez international', 'pepsico', 'coca-cola', 'anheuser-busch',
  'mcdonalds', 'yum brands', 'starbucks', 'hilton', 'marriott', 'wyndham',
  'american airlines', 'delta air lines', 'united airlines', 'southwest airlines',
  'carnival', 'royal caribbean', 'norwegian cruise line',
  'simon property group', 'prologis', 'public storage', 'equinix',
  'duke energy', 'southern company', 'dominion energy', 'nextera energy',
  'american electric power', 'exelon', 'consolidated edison', 'sempra energy',
  'waste management', 'republic services', 'cintas', 'automatic data processing',
  'paychex', 'fiserv', 'global payments', 'fidelity national information services',
  'western union', 'moody\'s', 's&p global', 'intercontinental exchange',
  'nasdaq', 'cme group', 'cboe global markets',
])

export function isFortune500(companyName: string | null): boolean {
  if (!companyName) return false
  const normalized = companyName.toLowerCase().trim()
  // Direct match
  if (FORTUNE_500_NAMES.has(normalized)) return true
  // Partial match for subsidiaries/variations
  for (const name of FORTUNE_500_NAMES) {
    if (normalized.includes(name) || name.includes(normalized)) {
      if (normalized.length > 4) return true
    }
  }
  return false
}

export function getCompanySizeBucket(employeeCount: number | null): string {
  if (!employeeCount) return 'Unknown'
  if (employeeCount <= 10) return '1–10'
  if (employeeCount <= 50) return '11–50'
  if (employeeCount <= 200) return '51–200'
  if (employeeCount <= 1000) return '201–1,000'
  return '1,000+'
}
