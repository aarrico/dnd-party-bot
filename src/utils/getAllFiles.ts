import * as fs from "fs";
import * as path from "path";

export const getAllFiles = (directory: string): string[] => {
  const files = fs.readdirSync(directory, { withFileTypes: true });

  return files
      .filter(file => file.isFile() && (file.name.endsWith(".js") || file.name.endsWith(".ts")))
      .map((file) => path.join(directory, file.name));
}

export function getAllFolders(directory: string): string[] {
  const files = fs.readdirSync(directory, { withFileTypes: true });

  return files
      .filter((file) => file.isDirectory())
      .map(file => path.join(directory, file.name));
}
