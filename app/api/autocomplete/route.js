export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input");

  if (!input) return Response.json({ predictions: [] });

  const GOOGLE_KEY = process.env.GOOGLE_API_KEY;

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&components=country:it&language=it&key=${GOOGLE_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  return Response.json(data);
}