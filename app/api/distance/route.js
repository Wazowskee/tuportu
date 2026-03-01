export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");

  if (!origin || !destination) {
    return Response.json({ error: "Missing params" }, { status: 400 });
  }

  const GOOGLE_KEY = process.env.GOOGLE_API_KEY;

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=driving&units=metric&language=it&key=${GOOGLE_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.rows?.[0]?.elements?.[0]?.status === "OK") {
    return Response.json({
      distance: data.rows[0].elements[0].distance.text,
      duration: data.rows[0].elements[0].duration.text,
    });
  }

  return Response.json({ error: "Route not found" }, { status: 404 });
}