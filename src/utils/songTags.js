export const WORSHIP_TAGS = [
  { id: 'adoracion',     label: 'Adoración',      color: '#FF9500' },
  { id: 'alabanza',      label: 'Alabanza',        color: '#FFD60A' },
  { id: 'comunion',      label: 'Comunión',        color: '#BF5AF2' },
  { id: 'navidad',       label: 'Navidad',         color: '#30D158' },
  { id: 'pentecostes',   label: 'Pentecostés',     color: '#FF9500' },
  { id: 'avivamiento',   label: 'Avivamiento',     color: '#FF453A' },
  { id: 'oracion',       label: 'Oración',         color: '#0A84FF' },
  { id: 'jovenes',       label: 'Jóvenes',         color: '#30D158' },
  { id: 'ofrenda',       label: 'Ofrenda',         color: '#FFD60A' },
  { id: 'clasico',       label: 'Clásico',         color: '#636366' },
  { id: 'contemporaneo', label: 'Contemporáneo',   color: '#0A84FF' },
  { id: 'himno',         label: 'Himno',           color: '#5E5CE6' },
  { id: 'coro',          label: 'Coro',            color: '#32ADE6' },
  { id: 'espiritu',      label: 'Espíritu Santo',  color: '#BF5AF2' },
  { id: 'gloria',        label: 'Gloria',          color: '#FFD60A' },
  { id: 'poder',         label: 'Poder',           color: '#FF453A' },
  { id: 'sanidad',       label: 'Sanidad',         color: '#30D158' },
  { id: 'esperanza',     label: 'Esperanza',       color: '#0A84FF' },
];

export const ALL_TAG_IDS = WORSHIP_TAGS.map((t) => t.id);

export function getTagById(id) {
  return WORSHIP_TAGS.find((t) => t.id === id) || null;
}

export function getTagColor(id) {
  const tag = getTagById(id);
  return tag ? tag.color : '#636366';
}

const KEYWORD_TAG_MAP = [
  { keywords: ['navidad', 'christmas', 'noche buena', 'nacimiento'],        tags: ['navidad'] },
  { keywords: ['espíritu', 'espiitu', 'espiritu', 'spirit', 'pneuma'],      tags: ['espiritu'] },
  { keywords: ['adorac', 'adoración'],                                       tags: ['adoracion'] },
  { keywords: ['gloria', 'glorioso', 'glorifica'],                          tags: ['gloria'] },
  { keywords: ['hosanna', 'aleluya', 'alelu', 'alabanza', 'alabado'],       tags: ['alabanza'] },
  { keywords: ['oración', 'oracion', 'prayer', 'ruego'],                    tags: ['oracion'] },
  { keywords: ['comunión', 'comunion', 'cena'],                             tags: ['comunion'] },
  { keywords: ['avivamiento', 'revival', 'fuego', 'restaura'],              tags: ['avivamiento'] },
  { keywords: ['himno'],                                                     tags: ['himno', 'clasico'] },
  { keywords: ['coro'],                                                      tags: ['coro'] },
  { keywords: ['joven', 'youth'],                                            tags: ['jovenes'] },
  { keywords: ['ofrenda', 'ofrendar'],                                       tags: ['ofrenda'] },
  { keywords: ['pentecostés', 'pentecostes', 'fuego'],                       tags: ['pentecostes'] },
  { keywords: ['poder', 'poderoso', 'todopoderoso'],                        tags: ['poder'] },
  { keywords: ['sanidad', 'sana', 'salud'],                                  tags: ['sanidad'] },
  { keywords: ['esperanza', 'espera', 'promesa'],                            tags: ['esperanza'] },
  { keywords: ['clásico', 'clasico', 'tradicional'],                        tags: ['clasico'] },
  { keywords: ['contemporáneo', 'contemporaneo', 'moderno'],                tags: ['contemporaneo'] },
];

export function inferTagsFromTitle(normalizedTitle) {
  const lower = normalizedTitle.toLowerCase();
  const found = new Set();
  for (const { keywords, tags } of KEYWORD_TAG_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) {
      tags.forEach((t) => found.add(t));
    }
  }
  return Array.from(found);
}
