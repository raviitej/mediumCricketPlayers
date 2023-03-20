const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeServerAndDbConnection = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {});
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initializeServerAndDbConnection();

const convertToCamelCase = (object) => {
  return {
    playerId: object.player_id,
    playerName: object.player_name,
  };
};
// API1
app.get("/players/", async (request, response) => {
  const dbQuery = "SELECT * FROM player_details";
  const teamData = await db.all(dbQuery);
  response.send(teamData.map((each) => convertToCamelCase(each)));
});

// API2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `SELECT
        *
        FROM
        player_details
        WHERE
        player_id = ${playerId};`;
  const playerHistory = await db.get(playerQuery);
  response.send(convertToCamelCase(playerHistory));
});
// API3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updateQuery = `UPDATE player_details SET player_name='${playerName}' WHERE  player_id = ${playerId};`;
  await db.run(updateQuery);
  response.send("Player Details Updated");
});

//API4
const convertToMatch = (each) => {
  return {
    matchId: each.match_id,
    match: each.match,
    year: each.year,
  };
};
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const playerQuery = `SELECT
        *
        FROM
        match_details
        WHERE
        match_id = ${matchId};`;
  const matchHistory = await db.get(playerQuery);
  response.send(convertToMatch(matchHistory));
});
//API5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `SELECT match_details.match_id,match_details.match,match_details.year From match_details NATURAL JOIN player_match_score WHERE player_match_score.player_id = ${playerId}`;
  const matchHistory = await db.all(playerQuery);
  response.send(matchHistory.map((each) => convertToMatch(each)));
});

//API6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playerQuery = `SELECT player_id,player_name From player_details NATURAL JOIN player_match_score WHERE player_match_score.match_id = ${matchId}`;
  const matchHistory = await db.all(playerQuery);
  response.send(matchHistory.map((each) => convertToCamelCase(each)));
});

// API7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `SELECT player_id AS playerId,player_name AS playerName,SUM(score) AS totalScore,SUM(fours) AS totalFours,SUM(sixes) AS totalSixes From player_details NATURAL JOIN player_match_score WHERE player_match_score.player_id = ${playerId}`;
  const matchHistory = await db.get(playerQuery);
  response.send(matchHistory);
});
module.exports = app;
