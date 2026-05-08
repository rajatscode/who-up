/**
 * City activity narratives — What people are doing right now (or at any given time)
 * 10 major cities × 4 time blocks (6h windows) = evocative descriptions
 *
 * Purpose: Make the visualization FEEL real. Numbers + dots aren't enough.
 * "I can see people walking around Tokyo" not "35M people awake"
 */

export const ACTIVITY_DESCRIPTIONS = {
  'Tokyo': {
    '0-6': 'Late night. Izakayas closing. Konbini clerks, night shift nurses. Streets quiet but never empty.',
    '6-12': 'Morning rush. First trains at 4:30am packed. Joggers in parks. Breakfast crowds at ramen shops and convenience stores.',
    '12-18': 'Daytime. Office workers, students, shoppers. Lunch rush at noon. Schools release 3pm.',
    '18-24': 'Evening. Dinner rush, entertainment districts alive. Quieter after 10pm as people head home.',
  },
  'Beijing': {
    '0-6': 'Deep night. Tai chi enthusiasts in parks. Jianbing (crepe) vendors preparing for dawn. Street quiet.',
    '6-12': 'Morning awakening. Tai chi, jogging. Schools and offices open. Ghost Street night market still buzzing.',
    '12-18': 'Peak hours. Markets full, office workers on lunch breaks. Shopping districts packed.',
    '18-24': 'Evening energy. Dinner crowds, street food vendors. Entertainment and nightlife.',
  },
  'Delhi': {
    '0-6': 'Night. Auto-rickshaws sparse. First trains of the day starting 3:25am. Street vendors preparing.',
    '6-12': 'Morning surge. First local trains packed with commuters. Chai wallahs busy. Markets opening.',
    '12-18': 'Afternoon heat. Siesta time for some. Markets and shops still active. Offices running.',
    '18-24': 'Evening relief. Cooler temperatures. Streets come alive. Vendor stalls multiplying.',
  },
  'Mumbai': {
    '0-6': 'Night shift underway. Dabbawala system still running. Hospital staff, police, cleaners.',
    '6-12': 'Morning chaos. Dabbawala peak hours. Central line packed. Coffee shops overflowing.',
    '12-18': 'Afternoon. Offices buzzing. Lunch deliveries via dabbawalas. Heat keeps some indoors.',
    '18-24': 'Evening bustle. Streets packed post-work. Chai stalls, street food. Social gatherings.',
  },
  'New York': {
    '0-6': 'Night shift. Street sweepers, bakers, hospital staff. Delivery trucks. ~8% awake.',
    '6-12': 'Morning rush. Early risers, commuters. Subway crush 7-9am. Coffee shops lines.',
    '12-18': 'Daytime peak. Office workers, retail, school pickup at 3pm. Lunch rush midday.',
    '18-24': 'Evening scene. Dinner rush, bars, entertainment. Broadway. Slower after 11pm.',
  },
  'Lagos': {
    '0-6': 'Night. Night clubs winding down. Early vendors preparing. Security patrols.',
    '6-12': 'Dawn rush. Go-slow (traffic jam) forming. Markets exploding. School runs.',
    '12-18': 'Afternoon peak. Gridlock on roads. Markets at peak. Shade seekers resting.',
    '18-24': 'Evening cool down. Traffic easing. Social gathering time. Street vendors everywhere.',
  },
  'London': {
    '0-6': 'Deep night. Night shift workers. Early morning cleaners. Parks empty.',
    '6-12': 'Morning commute. Tubes packed. Coffee culture in full swing. Central London waking.',
    '12-18': 'Working day peak. Office districts humming. Lunch breaks in parks. Shopping active.',
    '18-24': 'Evening wind-down. Pubs filling. Entertainment districts alive. Rush hour easing.',
  },
  'São Paulo': {
    '0-6': 'Night. Nightlife areas still buzzing. Night shift workers. Security guards.',
    '6-12': 'Morning. Metro packed. Favela wake-up. Office districts opening. Traffic building.',
    '12-18': 'Afternoon. Peak traffic and activity. Lunch spots crowded. Shopping malls busy.',
    '18-24': 'Evening scene. Restaurants full. Traffic chaos. Entertainment starting.',
  },
  'Cairo': {
    '0-6': 'Night. Fajr call to prayer starting 5am. Night markets. Few people on streets.',
    '6-12': 'Morning awakening. Fajr prayer, breakfast. Schools and markets opening.',
    '12-18': 'Afternoon. Lunch hour. Mosques busy at Zuhr prayer. Siesta time. Offices open.',
    '18-24': 'Evening vibrant. Maghrib prayer. Streets filling. Social time. Street food vendors.',
  },
  'Shanghai': {
    '0-6': 'Night market winding down. Night shift workers. Cleaning crews out.',
    '6-12': 'Morning rush. Metro packed. Tai chi in parks. Breakfast spots full.',
    '12-18': 'Peak business hours. Office towers buzzing. Lunch rush. Shopping districts packed.',
    '18-24': 'Evening entertainment. Dinner crowds. Neon lights. Bars and clubs opening.',
  },
};

/**
 * Get activity description for a city at a given local hour
 */
export function getActivityDescription(cityName, localHour) {
  const city = ACTIVITY_DESCRIPTIONS[cityName];
  if (!city) return null;

  // Determine time block (0-6, 6-12, 12-18, 18-24)
  let block;
  if (localHour < 6) block = '0-6';
  else if (localHour < 12) block = '6-12';
  else if (localHour < 18) block = '12-18';
  else block = '18-24';

  return city[block];
}
