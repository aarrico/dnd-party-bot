import * as fs from "fs";
import * as path from "path";

export function getAllFiles(directory: string) {
  let fileNames = [];
  const files = fs.readdirSync(directory, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(directory, file.name);
    if (file.isFile() && file.name.endsWith(".js" || ".ts")) {
      fileNames.push(new URL(`file://${filePath}`).toString());
    }
  }
  return fileNames;
}

export function getAllFolders(directory: string) {
  let folderNames = [];
  const files = fs.readdirSync(directory, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(directory, file.name);
    if (file.isDirectory()) {
      folderNames.push(filePath);
    }
  }
  return folderNames;
}
