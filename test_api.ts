async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/config/server', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guildId: '1318806349118963722',
        ownerId: '1035189920488235120',
        serverManagement: { logChannelId: '', welcomeChannelId: '1318806349919944837' }
      })
    });
    console.log(res.status);
    console.log(await res.text());
  } catch (e) { console.error(e); }
}
test();
