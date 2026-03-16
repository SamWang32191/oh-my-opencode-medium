const MEDIUM_TAG_PATTERN = /^v(\d+\.\d+\.\d+)-medium\.(\d+)$/;
const STABLE_UPSTREAM_TAG_PATTERN = /^v(\d+)\.(\d+)\.(\d+)$/;

export function parseMediumTag(tag: string) {
  const match = MEDIUM_TAG_PATTERN.exec(tag);

  if (!match) {
    return null;
  }

  return {
    upstreamVersion: match[1],
    forkPatch: Number.parseInt(match[2], 10),
  };
}

function compareVersions(a: string, b: string) {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);

  for (let index = 0; index < 3; index += 1) {
    if (aParts[index] !== bParts[index]) {
      return aParts[index] - bParts[index];
    }
  }

  return 0;
}

export function getLatestStableUpstreamVersion(tags: string[]) {
  const versions = tags
    .map((tag) => {
      const match = STABLE_UPSTREAM_TAG_PATTERN.exec(tag);
      return match ? `${match[1]}.${match[2]}.${match[3]}` : null;
    })
    .filter((version): version is string => version !== null)
    .sort(compareVersions);

  return versions.at(-1) ?? null;
}

export function getNextMediumRelease(
  upstreamVersion: string,
  existingTags: string[],
) {
  const highestForkPatch = existingTags
    .map(parseMediumTag)
    .filter(
      (parsed): parsed is { upstreamVersion: string; forkPatch: number } =>
        parsed !== null && parsed.upstreamVersion === upstreamVersion,
    )
    .reduce((highest, parsed) => Math.max(highest, parsed.forkPatch), 0);

  const nextForkPatch = highestForkPatch + 1;
  const packageVersion = `${upstreamVersion}-medium.${nextForkPatch}`;

  return {
    packageVersion,
    gitTag: `v${packageVersion}`,
  };
}

export function getReleaseCommitMessage(packageVersion: string) {
  return `chore: release ${packageVersion}`;
}

export function buildMediumReleasePlan({
  upstreamTags,
  existingTags,
}: {
  upstreamTags: string[];
  existingTags: string[];
}) {
  const upstreamVersion = getLatestStableUpstreamVersion(upstreamTags);

  if (!upstreamVersion) {
    throw new Error('No stable upstream tag found.');
  }

  return {
    upstreamTag: `v${upstreamVersion}`,
    ...getNextMediumRelease(upstreamVersion, existingTags),
  };
}
