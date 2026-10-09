export default function Setup() {
  return <main className="setup-page panel">
    <a href="/">← Return to EventScope</a>
    <h1>Connect Panta on your server</h1>
    <p>Add your Panta developer key on the server to connect live market data. The Superteam login is a separate account.</p>
    <ol>
      <li>In the official documentation playground, <a href="https://docs.panta.market/api-reference/auth/register" target="_blank" rel="noreferrer">register</a> or <a href="https://docs.panta.market/api-reference/auth/token" target="_blank" rel="noreferrer">log in</a>. Use the returned <code>access</code> as Bearer authentication on <a href="https://docs.panta.market/api-reference/account/create-key" target="_blank" rel="noreferrer">Create API key</a>. Select <code>env=live</code> for actual market reads. Save the one-time <code>secret</code> privately; keep <code>revokeOthers=false</code>.</li>
      <li>Copy <code>.env.example</code> to <code>.env.local</code> in the project folder.</li>
      <li>Set <code>PANTA_API_KEY</code> to your developer key in <code>.env.local</code> or your hosting platform's server environment.</li>
      <li>Restart the app. The homepage opens <strong>Live Panta</strong> by default. Run <code>npm run verify:live</code> to check the four read endpoints.</li>
    </ol>
    <p>Keep the key out of chat, screenshots, URLs, browser storage and Git. No credential entry is required in this webpage.</p>
    <p>Example data remains available without a key. Test keys authenticate on this API host, but our verification returned explicitly labelled sandbox fixtures with a non-mainnet market ID. Use a live key for actual market reads.</p>
    <p>Panta determines account access and rate limits. EventScope displays authentication errors and respects the retry deadline returned by the API.</p>
    <a href="https://docs.panta.market/guides/authentication" target="_blank" rel="noreferrer">Panta authentication documentation ↗</a>
  </main>;
}
