import { buildApiUrl } from "./api";

export const resolveMediaUrl = (path) => {
  if (!path) {
    return "";
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return buildApiUrl(path);
};
