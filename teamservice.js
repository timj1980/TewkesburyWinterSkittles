// teamService.js
import { supabase } from "./supabase.js";

export async function fetchDivisionTeamsMap() {
  try {
    console.log("--- DEBUG: Fetching season_lookup and Teams ---");
    
    // 1. Fetch season lookup data and teams data in parallel
    const [seasonRes, teamsRes] = await Promise.all([
      supabase.from('season_lookup').select('*').eq('season', '2026/27'),
      supabase.from('Teams').select('*')
    ]);

    if (seasonRes.error) {
      console.error("Error fetching season_lookup:", seasonRes.error);
      throw seasonRes.error;
    }
    if (teamsRes.error) {
      console.error("Error fetching Teams:", teamsRes.error);
      throw teamsRes.error;
    }

    console.log("Raw season_lookup rows:", seasonRes.data?.length);
    console.log("Raw Teams rows:", teamsRes.data?.length);

    // Create a lookup map for teams by their primary key / team ID
    const teamsMap = {};
    teamsRes.data.forEach(t => {
      // Check all common variants for team identifier and name
      const tKey = t.id !== undefined ? t.id : t["Team ID"];
      const tName = t["Team Name"] || t.team_name;
      if (tKey !== undefined && tName) {
        teamsMap[tKey] = tName;
      }
    });

    console.log("Built teamsMap:", teamsMap);

    const divisionMap = {};
    const teamIdMap = {};
    
    seasonRes.data.forEach(row => {
      const div = row.division; 
      // row.team_id from season_lookup should match the key in teamsMap
      const teamName = teamsMap[row.team_id];
      
      console.log(`season_lookup row id ${row.id}: team_id=${row.team_id}, div=${div} -> Found Name: ${teamName}`);

      if (!div || !teamName) {
        console.warn("Skipping row due to missing division or teamName:", row);
        return;
      }

      if (!divisionMap[div]) {
        divisionMap[div] = [];
      }
      divisionMap[div].push(teamName);

      teamIdMap[teamName] = {
        lookupId: row.id,
        teamId: row.team_id
      };
    });

    console.log("Final divisionMap:", divisionMap);
    console.log("Final teamIdMap:", teamIdMap);

    return { divisionMap, teamIdMap };
  } catch (err) {
    console.error('Error fetching teams from database:', err);
    return { divisionMap: {}, teamIdMap: {} }; 
  }
}