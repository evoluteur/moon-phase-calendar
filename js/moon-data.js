/*
  Moon Phase Calendar - data
  https://github.com/evoluteur/moon-phase-calendar
  (c) 2026 Olivier Giulieri

  Phase and sign meanings were written for this app, in the spirit of
  the lunar and astrological traditions.
*/

// the 8 phases, in order from the new moon
const PHASES = [
  {
    id: "new",
    name: "New Moon",
    short: "New",
    keywords: ["Seeds", "Intention", "Beginnings"],
    text: "The Moon sits between the Earth and the Sun and shows us its dark side. It is the quiet start of the cycle: a blank page. Traditions treat it as the time to set intentions and plant seeds, when nothing is visible yet but everything is possible.",
    goodFor: ["Setting intentions", "Starting a journal", "Rest and planning", "Wishes and vision boards"],
  },
  {
    id: "waxing-crescent",
    name: "Waxing Crescent",
    short: "Waxing crescent",
    keywords: ["Hope", "Commitment", "First steps"],
    text: "A thin sliver of light appears in the western sky after sunset. The intention of the new moon takes its first breath. This is the phase of faith and small, steady steps, when you gather what you need and commit to the path.",
    goodFor: ["Taking the first step", "Gathering resources", "Affirmations", "Building habits"],
  },
  {
    id: "first",
    name: "First Quarter",
    short: "First quarter",
    keywords: ["Action", "Decision", "Courage"],
    text: "Half of the Moon is lit, and it rises around noon. The first test of the cycle: obstacles show up and choices must be made. It is a time for action and courage, to push through resistance and adjust the plan.",
    goodFor: ["Making decisions", "Overcoming obstacles", "Hard work", "Physical effort"],
  },
  {
    id: "waxing-gibbous",
    name: "Waxing Gibbous",
    short: "Waxing gibbous",
    keywords: ["Refinement", "Patience", "Trust"],
    text: "The Moon is more than half lit and still growing. The work is nearly done but not quite: it is the time to refine, edit and polish, to be patient and trust the process as things ripen.",
    goodFor: ["Editing and refining", "Learning", "Practice", "Patience"],
  },
  {
    id: "full",
    name: "Full Moon",
    short: "Full",
    keywords: ["Culmination", "Clarity", "Release"],
    text: "The Earth sits between the Sun and the Moon, and the whole face of the Moon is lit all night long. It is the peak of the cycle: what was planted comes to light. Emotions run high, truths are revealed, and it is the traditional time for gratitude, celebration and releasing what no longer serves.",
    goodFor: ["Gratitude and celebration", "Releasing rituals", "Charging crystals", "Moonlit walks"],
  },
  {
    id: "waning-gibbous",
    name: "Waning Gibbous",
    short: "Waning gibbous",
    keywords: ["Sharing", "Gratitude", "Teaching"],
    text: "Also called the Disseminating Moon. The light begins to shrink, rising later each night. It is the time to share what you learned, to teach and give back, and to take stock of the harvest.",
    goodFor: ["Sharing and teaching", "Giving thanks", "Reflection", "Generosity"],
  },
  {
    id: "last",
    name: "Last Quarter",
    short: "Last quarter",
    keywords: ["Letting go", "Forgiveness", "Clearing"],
    text: "Also called the Third Quarter. Half of the Moon is lit again, now on the other side, and it rises around midnight. The second turning point: time to let go, forgive, and clear away what is finished to make room for the next cycle.",
    goodFor: ["Decluttering", "Breaking habits", "Forgiveness", "Ending things"],
  },
  {
    id: "waning-crescent",
    name: "Waning Crescent",
    short: "Waning crescent",
    keywords: ["Rest", "Surrender", "Healing"],
    text: "Also called the Balsamic Moon. A last thin crescent rises before dawn. The cycle turns inward: it is a time for rest, meditation and healing, for dreams and quiet before the next new moon.",
    goodFor: ["Rest and sleep", "Meditation", "Healing", "Dream work"],
  },
];

// the 12 signs of the tropical zodiac, for the Moon's position
const SIGNS = [
  {
    name: "Aries",
    glyph: "♈︎",
    element: "Fire",
    keywords: ["Bold", "Impulsive", "Energetic"],
    text: "Moods are quick and fiery. Energy is high and patience is short: a good day to start something, less so to wait for anything.",
    goodFor: ["Starting projects", "Exercise", "Bold moves"],
  },
  {
    name: "Taurus",
    glyph: "♉︎",
    element: "Earth",
    keywords: ["Steady", "Sensual", "Comfort"],
    text: "The Moon is at home in Taurus: calm, grounded and in search of comfort. A day for good food, nature and slow, steady work.",
    goodFor: ["Gardening", "Money matters", "Pampering"],
  },
  {
    name: "Gemini",
    glyph: "♊︎",
    element: "Air",
    keywords: ["Curious", "Chatty", "Restless"],
    text: "The mind is quick and curious and wants variety. A day for talking, writing, learning and short trips, not for sitting still.",
    goodFor: ["Conversations", "Writing", "Learning"],
  },
  {
    name: "Cancer",
    glyph: "♋︎",
    element: "Water",
    keywords: ["Nurturing", "Sensitive", "Home"],
    text: "The Moon rules Cancer, so feelings run deep. A day to care for yourself and others, stay close to home and family, and trust your intuition.",
    goodFor: ["Home and family", "Cooking", "Self-care"],
  },
  {
    name: "Leo",
    glyph: "♌︎",
    element: "Fire",
    keywords: ["Warm", "Playful", "Proud"],
    text: "Hearts are warm and generous and want to shine. A day for creativity, play, romance and a little drama.",
    goodFor: ["Creative work", "Parties", "Romance"],
  },
  {
    name: "Virgo",
    glyph: "♍︎",
    element: "Earth",
    keywords: ["Practical", "Tidy", "Helpful"],
    text: "The mood is practical and precise. A day for sorting, cleaning, health routines and getting the details right.",
    goodFor: ["Organizing", "Health routines", "Detailed work"],
  },
  {
    name: "Libra",
    glyph: "♎︎",
    element: "Air",
    keywords: ["Harmony", "Social", "Fair"],
    text: "The Moon seeks balance and beauty. A day for partnership, diplomacy, art and making peace.",
    goodFor: ["Relationships", "Negotiation", "Beauty and art"],
  },
  {
    name: "Scorpio",
    glyph: "♏︎",
    element: "Water",
    keywords: ["Intense", "Deep", "Transforming"],
    text: "Feelings are intense and private. A day to dig deep, research, transform and let go of what has run its course.",
    goodFor: ["Research", "Deep talks", "Transformation"],
  },
  {
    name: "Sagittarius",
    glyph: "♐︎",
    element: "Fire",
    keywords: ["Adventurous", "Optimistic", "Free"],
    text: "Spirits are high and restless. A day for adventure, big ideas, travel, study and seeing the bigger picture.",
    goodFor: ["Travel", "Study", "Big-picture planning"],
  },
  {
    name: "Capricorn",
    glyph: "♑︎",
    element: "Earth",
    keywords: ["Disciplined", "Ambitious", "Serious"],
    text: "Emotions are kept in check and the focus is on work. A day for structure, goals, responsibility and long-term plans.",
    goodFor: ["Career goals", "Planning", "Discipline"],
  },
  {
    name: "Aquarius",
    glyph: "♒︎",
    element: "Air",
    keywords: ["Independent", "Inventive", "Friendly"],
    text: "The mood is detached, open-minded and a little unusual. A day for friends, groups, new ideas and breaking routine.",
    goodFor: ["Friends and community", "Innovation", "Trying new things"],
  },
  {
    name: "Pisces",
    glyph: "♓︎",
    element: "Water",
    keywords: ["Dreamy", "Intuitive", "Compassionate"],
    text: "Boundaries dissolve and intuition runs strong. A day for dreams, music, meditation, compassion and rest.",
    goodFor: ["Meditation", "Art and music", "Rest"],
  },
];

// traditional full moon names (Northern Hemisphere, North American almanac tradition)
const FULL_MOON_NAMES = [
  { name: "Wolf Moon", text: "Wolves were said to howl in hunger outside the villages in the deep of winter." },
  { name: "Snow Moon", text: "The month of the heaviest snows in much of North America." },
  { name: "Worm Moon", text: "The ground thaws and earthworms come back to the surface." },
  { name: "Pink Moon", text: "Named for the pink wild ground phlox, one of the first flowers of spring." },
  { name: "Flower Moon", text: "Flowers bloom everywhere in late spring." },
  { name: "Strawberry Moon", text: "The time to gather ripening wild strawberries." },
  { name: "Buck Moon", text: "Male deer grow their new antlers in early summer." },
  { name: "Sturgeon Moon", text: "Sturgeon were easy to catch in the Great Lakes at this time of year." },
  { name: "Corn Moon", text: "The time to harvest corn." },
  { name: "Hunter's Moon", text: "The moon after the Harvest Moon: the time to hunt and prepare for winter." },
  { name: "Beaver Moon", text: "Beavers build their winter dams, and it was the time to set beaver traps." },
  { name: "Cold Moon", text: "The long nights and cold of early winter." },
];

const HARVEST_MOON = {
  name: "Harvest Moon",
  text: "The full moon closest to the autumn equinox. It rises soon after sunset several nights in a row, giving farmers extra light to bring in the harvest.",
};

const BLUE_MOON = "The second full moon in a calendar month. It happens about every 2.7 years, hence the saying “once in a blue moon”.";
const SUPERMOON = "A full moon near perigee, the point of the Moon's orbit closest to the Earth (under 361,000 km here). It looks up to 14% bigger and 30% brighter than a full moon at apogee.";
const MICROMOON = "A full moon near apogee, the point of the Moon's orbit farthest from the Earth (over 405,000 km here). It looks a little smaller and dimmer than usual.";
const BLACK_MOON = "The second new moon in a calendar month.";
const LUNAR_ECLIPSES = {
  total: {
    label: "Total lunar eclipse",
    text: "The whole Moon passes into the Earth's shadow and turns red, lit only by the sunsets and sunrises around the Earth: a Blood Moon.",
  },
  partial: {
    label: "Partial lunar eclipse",
    text: "Part of the Moon passes into the Earth's dark shadow and looks bitten.",
  },
  penumbral: {
    label: "Penumbral lunar eclipse",
    text: "The Moon only crosses the Earth's faint outer shadow: a subtle dimming, easy to miss.",
  },
};
