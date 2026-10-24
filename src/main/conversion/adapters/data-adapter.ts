import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import yaml from 'js-yaml';
import xml2js from 'xml2js';
import { ConversionCapability, FileItem } from '../../../shared/types';

export interface DataConversionResult {
  outputPath: string;
  outputSize: number;
}

export async function processDataConversion(
  file: FileItem,
  capability: ConversionCapability,
  options: Record<string, any>,
  targetDir: string,
  onProgress?: (progress: number, stage?: string) => void,
): Promise<DataConversionResult> {
  onProgress?.(20, 'Reading raw source data...');
  const rawContent = await fs.promises.readFile(file.path, 'utf-8');
  const baseName = path.parse(file.name).name;
  const ext = file.extension.toLowerCase();
  const targetExt = capability.targetExtension.toLowerCase();

  onProgress?.(45, 'Parsing structured data...');
  let parsedData: any;

  // Step 1: Parse input into JS object/array
  if (ext === 'json') {
    parsedData = JSON.parse(rawContent);
  } else if (ext === 'csv' || ext === 'tsv') {
    parsedData = parse(rawContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ext === 'tsv' ? '\t' : ',',
    });
  } else if (ext === 'yaml' || ext === 'yml') {
    parsedData = yaml.load(rawContent);
  } else if (ext === 'xml') {
    parsedData = await xml2js.parseStringPromise(rawContent);
  } else {
    throw new Error(`Unsupported input data format: ${ext}`);
  }

  onProgress?.(70, `Formatting output to ${capability.targetFormat}...`);
  let outputContent = '';

  // Step 2: Format parsedData into target format
  if (targetExt === 'json') {
    outputContent = JSON.stringify(parsedData, null, 2);
  } else if (targetExt === 'csv') {
    let records: any[] = [];
    if (Array.isArray(parsedData)) {
      records = parsedData;
    } else if (typeof parsedData === 'object' && parsedData !== null) {
      const arrayKey = Object.keys(parsedData).find(
        (k) =>
          Array.isArray(parsedData[k]) && typeof parsedData[k][0] === 'object',
      );
      if (arrayKey) {
        records = parsedData[arrayKey];
      } else {
        records = [parsedData];
      }
    } else {
      records = [{ value: parsedData }];
    }
    outputContent = stringify(records, { header: true });
  } else if (targetExt === 'yaml') {
    outputContent = yaml.dump(parsedData, { indent: 2 });
  } else if (targetExt === 'xml') {
    const builder = new xml2js.Builder({ rootName: 'root' });
    outputContent = builder.buildObject(parsedData);
  } else {
    throw new Error(`Unsupported target data format: ${targetExt}`);
  }

  onProgress?.(90, 'Writing result...');
  const outputPath = path.join(targetDir, `${baseName}.${targetExt}`);
  await fs.promises.writeFile(outputPath, outputContent, 'utf-8');

  const stats = await fs.promises.stat(outputPath);
  onProgress?.(100, 'Data conversion complete');

  return {
    outputPath,
    outputSize: stats.size,
  };
}
