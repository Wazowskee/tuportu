export async function POST(request) {
  try {
    const body = await request.json();

    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzWCGoqDF98I8CjWpGbo-JHipYO4jMUd3tSJyzIP_Xts8USHUl4XZ3f6icx1p8btaye/exec";

    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text();

    return Response.json({ result: "success", raw: text });
  } catch (err) {
    return Response.json({ result: "error", message: err.message }, { status: 500 });
  }
}