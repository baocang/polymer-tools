import os = require('os');
import fs = require('fs');
import path = require('path');
import crypto = require('crypto');

import File = require('vinyl');

import logging = require('@polymer-tools/plylog');


const logger = logging.getLogger('cli.build.cache');


const sha1 = (buf: Buffer) => {
  return crypto.createHash('sha1').update(buf).digest('hex');
};

let cacheDir: string;

function prepCacheDir() {
  const homeDir = os.homedir();
  cacheDir = path.join(homeDir, '.polymer-tools', 'cache');

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, {recursive: true});
  }
}

function getCachePath(filePath: string, fileCwd: string) {
  const lastSepIndex = (fileCwd || '').lastIndexOf(path.sep);
  let relativeFileName = filePath;

  if (filePath.startsWith(fileCwd)) {
    relativeFileName = filePath.substr(Math.max(0, lastSepIndex));
  }

  if (/_script_\d+\.js$/.test(relativeFileName)) {
    relativeFileName = path.join(
        relativeFileName.substr(0, relativeFileName.lastIndexOf('_script_')),
        'inline' +
            relativeFileName.substr(relativeFileName.lastIndexOf('_script_')));
  }

  return relativeFileName;
}

export function readFileFromCache(file: File): File|undefined {
  if (!cacheDir) {
    prepCacheDir();
  }

  const fileBase = file.base;
  const fileCwd = file.cwd;
  const filePath = file.path;
  const sourceDigest = sha1(file.contents as Buffer);
  const relativeFileName = getCachePath(filePath, fileCwd);
  const cacheFilePath = path.join(cacheDir, relativeFileName);
  const fileExt = relativeFileName.substr(relativeFileName.lastIndexOf('.'));
  const cacheFileName = path.join(cacheFilePath, sourceDigest + fileExt);

  if (!fs.existsSync(cacheFileName)) {
    return undefined;
  }

  const fileContents = fs.readFileSync(cacheFileName);

  if (!fileContents || fileContents.length === 0) {
    return undefined;
  }

  logger.debug('cached file: ', cacheFileName);

  return new File({
    cwd: fileCwd,
    base: fileBase,
    path: filePath,
    contents: fileContents,
  });
}

export function writeContentToCache(srcFile: File, contents: string) {
  if (!cacheDir) {
    prepCacheDir();
  }

  const fileCwd = srcFile.cwd;
  const filePath = srcFile.path;
  const sourceDigest = sha1(srcFile.contents as Buffer);
  const relativeFileName = getCachePath(filePath, fileCwd);
  const cacheFilePath = path.join(cacheDir, relativeFileName);
  const fileExt = relativeFileName.substr(relativeFileName.lastIndexOf('.'));
  const cacheFileName = path.join(cacheFilePath, sourceDigest + fileExt);

  if (!fs.existsSync(cacheFileName)) {
    fs.mkdirSync(cacheFilePath, {recursive: true});
    logger.debug('write cache: ', cacheFileName);
    fs.writeFileSync(cacheFileName, contents);
  }
}
