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
  let relativeFileName = filePath.substr(fileCwd.lastIndexOf(path.sep));

  if (/_script_\d+\.js$/.test(relativeFileName)) {
    relativeFileName = path.join(
        relativeFileName.substr(0, relativeFileName.lastIndexOf('_script_')),
        'inline' +
            relativeFileName.substr(relativeFileName.lastIndexOf('_script_')));
  }

  return relativeFileName;
}

export function readFileFromCache(file: File): File|null {
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

  let fileContents: Buffer|null = null;

  if (fs.existsSync(cacheFileName)) {
    fileContents = fs.readFileSync(cacheFileName);
  }

  if (fileContents === null || fileContents.length === 0) {
    return null;
  }

  logger.debug('read cache: ', cacheFileName);

  return new File({
    cwd: fileCwd,
    base: fileBase,
    path: filePath,
    contents: fileContents,
  });
}

export function writeFileToCache(file: File, orgFileContents: Buffer) {
  if (!cacheDir) {
    prepCacheDir();
  }

  const fileCwd = file.cwd;
  const filePath = file.path;
  const sourceDigest = sha1(orgFileContents);
  const relativeFileName = getCachePath(filePath, fileCwd);
  const cacheFilePath = path.join(cacheDir, relativeFileName);
  const fileExt = relativeFileName.substr(relativeFileName.lastIndexOf('.'));
  const cacheFileName = path.join(cacheFilePath, sourceDigest + fileExt);

  if (!fs.existsSync(cacheFileName)) {
    fs.mkdirSync(cacheFilePath, {recursive: true});
    logger.debug('cache file', cacheFileName);
    fs.writeFileSync(cacheFileName, file.contents);
  }
}

export function writeContentToCache(file: File, contents: string) {
  if (!cacheDir) {
    prepCacheDir();
  }

  const fileCwd = file.cwd;
  const filePath = file.path;
  const sourceDigest = sha1(file.contents as Buffer);
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
