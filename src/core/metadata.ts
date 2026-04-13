export type Metadata = {
  name: string;
  url: string;
};

export function emptyMetadata(): Metadata {
  return { name: "", url: "" };
}
