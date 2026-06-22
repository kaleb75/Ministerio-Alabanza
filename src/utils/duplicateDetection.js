export const DUPLICATE_SUFFIXES = [
  'chords', 'acordes', 'acorde', 'sheet', 'partitura', 'partituras',
  'letra', 'letras', 'lyrics', 'tabs', 'cifrado', 'cifra',
  'paul baloche', 'marcos witt', 'marco barrientos', 'danilo montero',
  'gateway worship', 'hillsong',
];

export function stripDuplicateSuffixes(slug) {
  let result = slug;
  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of DUPLICATE_SUFFIXES) {
      const slugSuffix = suffix.replace(/\s+/g, '-');
      if (result.endsWith('-' + slugSuffix)) {
        result = result.slice(0, -(slugSuffix.length + 1));
        changed = true;
      }
    }
  }
  return result;
}

export function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = [];
  for (let i = 0; i <= a.length; i++) {
    dp[i] = [i];
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = i === 0
        ? j
        : Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + (a[i - 1] !== b[j - 1] ? 1 : 0)
          );
    }
  }
  return dp[a.length][b.length];
}

export function fuzzyMatch(slugA, slugB) {
  const a = stripDuplicateSuffixes(slugA);
  const b = stripDuplicateSuffixes(slugB);
  if (a === b) return true;
  if (b.length >= 5 && a.includes(b)) return true;
  if (a.length >= 5 && b.includes(a)) return true;
  const minLen = Math.min(a.length, b.length);
  if (minLen >= 6 && levenshteinDistance(a, b) <= 2) return true;
  return false;
}

function pickCanonical(group) {
  return group.reduce((best, entry) => {
    const bestFiles = (best.sourceFiles || []).length;
    const entryFiles = (entry.sourceFiles || []).length;
    if (entryFiles > bestFiles) return entry;
    if (entryFiles === bestFiles && (entry.usageStats?.totalUses || 0) > (best.usageStats?.totalUses || 0)) return entry;
    return best;
  });
}

function inferDuplicateReason(slugA, slugB) {
  const a = stripDuplicateSuffixes(slugA);
  const b = stripDuplicateSuffixes(slugB);
  if (a === b && slugA !== slugB) return 'Sufijo extra';
  if (a.includes(b) || b.includes(a)) return 'Nombre contenido';
  if (levenshteinDistance(a, b) <= 2) return 'Diferencia de acentos o tipografía';
  return 'Similitud alta';
}

export function groupDuplicates(catalogEntries) {
  const groups = [];
  const assigned = new Set();

  for (let i = 0; i < catalogEntries.length; i++) {
    if (assigned.has(catalogEntries[i].id)) continue;
    const group = [catalogEntries[i]];
    for (let j = i + 1; j < catalogEntries.length; j++) {
      if (assigned.has(catalogEntries[j].id)) continue;
      if (fuzzyMatch(catalogEntries[i].slug, catalogEntries[j].slug)) {
        group.push(catalogEntries[j]);
        assigned.add(catalogEntries[j].id);
      }
    }
    if (group.length > 1) {
      assigned.add(catalogEntries[i].id);
      const canonical = pickCanonical(group);
      const variants = group
        .filter((e) => e.id !== canonical.id)
        .map((e) => ({
          id: e.id,
          title: e.title,
          slug: e.slug,
          reason: inferDuplicateReason(canonical.slug, e.slug),
        }));
      const distance = levenshteinDistance(
        stripDuplicateSuffixes(canonical.slug),
        stripDuplicateSuffixes(variants[0]?.slug || '')
      );
      groups.push({
        canonicalId: canonical.id,
        canonicalTitle: canonical.title,
        variants,
        confidence: distance === 0 ? 'high' : 'medium',
      });
    }
  }

  return groups;
}

export function mergeDuplicateGroup(group, allEntries) {
  const canonical = allEntries.find((e) => e.id === group.canonicalId);
  if (!canonical) return null;

  const variantEntries = group.variants
    .map((v) => allEntries.find((e) => e.id === v.id))
    .filter(Boolean);

  const mergedSourceFiles = [...(canonical.sourceFiles || [])];
  const seenFileNames = new Set(mergedSourceFiles.map((f) => f.fileName));

  variantEntries.forEach((v) => {
    (v.sourceFiles || []).forEach((sf) => {
      if (!seenFileNames.has(sf.fileName)) {
        mergedSourceFiles.push(sf);
        seenFileNames.add(sf.fileName);
      }
    });
  });

  const mergedFormats = { ...canonical.availableFormats };
  variantEntries.forEach((v) => {
    Object.keys(mergedFormats).forEach((k) => {
      mergedFormats[k] = mergedFormats[k] || (v.availableFormats?.[k] || false);
    });
  });

  const mergedTags = Array.from(new Set([
    ...(canonical.tags || []),
    ...variantEntries.flatMap((v) => v.tags || []),
  ]));

  return { ...canonical, sourceFiles: mergedSourceFiles, availableFormats: mergedFormats, tags: mergedTags };
}

export function detectAndMerge(catalogEntries) {
  const groups = groupDuplicates(catalogEntries);
  if (!groups.length) return { merged: catalogEntries, duplicatesFound: 0, groupsResolved: 0 };

  const variantIds = new Set(groups.flatMap((g) => g.variants.map((v) => v.id)));
  const mergedEntries = catalogEntries
    .filter((e) => !variantIds.has(e.id))
    .map((e) => {
      const group = groups.find((g) => g.canonicalId === e.id);
      if (group) return mergeDuplicateGroup(group, catalogEntries) || e;
      return e;
    });

  return {
    merged: mergedEntries,
    duplicatesFound: groups.reduce((sum, g) => sum + g.variants.length, 0),
    groupsResolved: groups.length,
  };
}
