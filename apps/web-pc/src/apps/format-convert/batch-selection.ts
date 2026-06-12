export interface CloudSelectionEntry {
  path: string;
  name: string;
}

export const getLocalFileSignature = (file: File) => {
  return [file.name, file.size, file.type, file.lastModified].join(':');
};

export const mergeLocalFiles = (currentFiles: File[], incomingFiles: File[]) => {
  const signatures = new Set(currentFiles.map(getLocalFileSignature));
  const merged = [...currentFiles];

  incomingFiles.forEach(file => {
    const signature = getLocalFileSignature(file);
    if (signatures.has(signature)) {
      return;
    }
    signatures.add(signature);
    merged.push(file);
  });

  return merged;
};

export const buildCloudSelectionEntry = (item: { path: string; name: string }): CloudSelectionEntry => ({
  path: item.path,
  name: item.name,
});

export const createCloudSelectionMap = (items: CloudSelectionEntry[]) => {
  return items.reduce<Record<string, CloudSelectionEntry>>((selection, item) => {
    selection[item.path] = item;
    return selection;
  }, {});
};

export const removeCloudSelectionEntry = (selection: Record<string, CloudSelectionEntry>, path: string) => {
  const next = { ...selection };
  delete next[path];
  return next;
};
