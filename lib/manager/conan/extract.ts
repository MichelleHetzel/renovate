import * as datasourceConan from '../../datasource/conan';
import { logger } from '../../logger';
import * as loose from '../../versioning/loose';
import type { PackageDependency, PackageFile } from '../types';

export function getDep(
  depName: string,
  currentValue: string,
  currentDigest: string
): PackageDependency {
  const dep: PackageDependency = {
    depName,
    currentValue,
    currentDigest,
  };

  dep.datasource = datasourceConan.id;
  dep.versioning = loose.id;

  return dep;
}

export default function extractPackageFile(
  content: string
): PackageFile | null {
  const deps: PackageDependency[] = [];

  const fromMatches = content.matchAll(
    /(?<name>[a-z\-_0-9]+)\/(?<version>[^@\n"']+)(?<userChannel>@\S+\/[^\n"' ]+)?/gim
  );

  for (const fromMatch of fromMatches) {
    if (fromMatch.groups.name) {
      let userAndChannel = '@_/_';

      if (fromMatch.groups.userChannel) {
        userAndChannel = fromMatch.groups.userChannel;
      }

      // ignore packages with set ranges, conan will handle this on the project side
      if (!fromMatch.groups.version.includes('[')) {
        logger.trace(
          `Found a conan package ${fromMatch.groups.name} ${fromMatch.groups.version} ${userAndChannel}`
        );

        const dep = getDep(
          fromMatch.groups.name,
          fromMatch.groups.version,
          userAndChannel
        );
        logger.debug({
          depName: dep.depName,
          currentValue: dep.currentValue,
          digest: dep.currentDigest,
        });
        deps.push(dep);
      }
    }
  }

  if (!deps.length) {
    return null;
  }
  return { deps };
}
