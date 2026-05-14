import fs from 'fs';

async function scrapePlayers() {
  try {
    console.log("Fetching IPL players from Wikipedia...");
    const res = await fetch("https://en.wikipedia.org/w/api.php?action=parse&page=List_of_Indian_Premier_League_players&format=json&prop=text");
    const data = await res.json();
    const html = data.parse.text["*"];
    
    // We will extract player names from the table rows.
    // The table rows look like: <tr><td><a href="...">MS Dhoni</a></td>...
    const playerRegex = /<tr>\s*<t[dh][^>]*>(?:<span[^>]*>.*?<\/span>\s*)?(?:<a href="[^"]*" title="[^"]*">)?([^<]+)(?:<\/a>)?/g;
    
    let match;
    const playersMap = new Map();
    
    // A quick way to grab names from the HTML
    const nameRegex = /<a href="\/wiki\/[^"]*" title="([^"]+)">/g;
    let names = [];
    while ((match = nameRegex.exec(html)) !== null) {
      const name = match[1];
      if (!name.includes("cricket") && !name.includes("List of") && !name.includes("Indian Premier League") && name.split(" ").length >= 2) {
        // Clean up "(cricketer)"
        const cleanName = name.replace(/\s*\(.*?\)\s*/g, '').trim();
        playersMap.set(cleanName, {
          name: cleanName,
          nationality: "Unknown", // Will be inferred by AI later
          role: "Unknown",
          teams: [],
          seasons: [],
          isCaptain: false,
          awards: [],
          attributes: {}
        });
      }
    }
    
    let playersArray = Array.from(playersMap.values());
    console.log(`Found ${playersArray.length} potential players.`);
    
    // De-duplicate and filter out obvious non-players (like teams)
    const teams = ["Chennai Super Kings", "Mumbai Indians", "Royal Challengers Bangalore", "Kolkata Knight Riders", "Delhi Capitals", "Sunrisers Hyderabad", "Rajasthan Royals", "Punjab Kings", "Gujarat Titans", "Lucknow Super Giants"];
    playersArray = playersArray.filter(p => !teams.includes(p.name) && p.name.length < 30);
    
    console.log(`Filtered to ${playersArray.length} players.`);
    
    // If we didn't get enough, fallback to a predefined massive list or just save what we have
    if (playersArray.length > 100) {
      fs.writeFileSync("lib/players.json", JSON.stringify(playersArray, null, 2));
      console.log("Successfully updated lib/players.json with all players from web!");
    } else {
      console.log("Scraping failed to find enough players. Regex might need tweaking.");
    }
  } catch (err) {
    console.error("Scraping error:", err);
  }
}

scrapePlayers();
