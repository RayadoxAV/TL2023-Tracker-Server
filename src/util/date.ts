export function generateISODate() {
  const date = new Date(new Date().getTime()).toISOString();
  
  return date;
}
