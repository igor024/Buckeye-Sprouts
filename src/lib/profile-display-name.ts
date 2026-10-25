/** Support existing demo database rows and auth metadata during the sample rename. */
export function profileDisplayName(name: string): string {
  return name === "Alex Morgan" ? "Alex Rabochii" : name;
}
