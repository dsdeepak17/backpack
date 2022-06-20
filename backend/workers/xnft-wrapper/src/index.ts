const RPC = "https://api.devnet.solana.com";

export default {
  async fetch(request: Request): Promise<Response> {
    const { searchParams, pathname } = new URL(request.url);

    let bundle = searchParams.get("bundle");

    if (!bundle) {
      const xnftMint = pathname.match(/^\/(\w{30,50})/)?.[1];
      if (xnftMint) {
        try {
          const res = await fetch(
            `https://metaplex-api.gootools.workers.dev/${xnftMint}?rpc=${RPC}`
          );
          const {
            name,
            description,
            properties: { bundle: _bundle },
          } = await res.json();
          bundle = _bundle;
        } catch (err) {
          return json({ error: err.message }, 500);
        }
      }
    }

    if (bundle) {
      try {
        new URL(bundle);
      } catch (err) {
        return json({ error: "bundle is not a valid url" }, 500);
      }
    } else {
      return json({ error: "bundle parameter is required" }, 404);
    }

    try {
      let innerHTML;

      if (searchParams.has("external")) {
        // TODO: add integrity hash? https://www.srihash.org
        innerHTML = `<script type="module" src="${bundle}" defer></script>`;
      } else {
        const res = await fetch(bundle);
        const js = await res.text();
        // TODO: see if possible to check if valid JS without executing it,
        //       because `new Function(js);` is not possible on a worker
        innerHTML = `
        <!-- code loaded from ${bundle} -->
        <script type="module" defer>${js}</script>`;
      }

      return html(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <script
              type="application/javascript"
              src="https://unpkg.com/@solana/web3.js@1.43.2/lib/index.iife.min.js"
            ></script>
            <meta charset="utf-8"/>
          </head>
          <body>${innerHTML}</body>
        </html>
      `);
    } catch (err) {
      return json({ error: "error creating html" }, 500);
    }
  },
};

const html = (data: string) =>
  new Response(data, {
    headers: {
      "content-type": "text/html",
    },
  });

const json = (data: any, status) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
